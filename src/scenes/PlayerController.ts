import Phaser, { Physics } from 'phaser'
import StateMachine from '../statemachine/StateMachine';
import { sharedInstance as events } from './EventCenter'

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
type Sprite = Phaser.Physics.Matter.Sprite;

export default class PlayerController {
    private sprite: Sprite;
    private cursors: CursorKeys;
    private stateMacine: StateMachine

    constructor(sprite: Sprite, cursors: CursorKeys) {
        this.sprite = sprite;
        this.cursors = cursors;

        this.createAnimations();
        this.stateMacine = new StateMachine(this, 'player');

        this.stateMacine
            .addState('idle', {
                onEnter: this.idleOnEnter,
                onUpdate: this.idleOnUpdate
            })
            .addState('walk', {
                onEnter: this.walkOnEnter,
                onUpdate: this.walkOnUpdate,
            })
            .addState('jump', {
                onEnter: this.jumpOnEnter,
                onUpdate: this.jumpOnUpdate,
            })
            .setState('idle');

        this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
            console.dir(data);
            let body = data.bodyB as MatterJS.BodyType;
            let gameObject = body.gameObject;

            if (!gameObject) {
                return;
            }

            // if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
                if (this.stateMacine.isCurrentState('jump')) {
                    this.stateMacine.setState('idle');
                }
                // return;
            // }

            let sprite = gameObject as Phaser.Physics.Matter.Sprite;
            let type = sprite.getData('type');

            switch (type) {
                case 'star': {
                    events.emit('star-collected');
                    sprite.destroy();
                    break;
                }
            }

        });

    }

    update(dt: number) {
        this.stateMacine.update(dt);
    }

    private idleOnEnter() {
        this.sprite.play('player-idle');
    }

    private idleOnUpdate() {
        if (this.cursors.left.isDown || this.cursors.right.isDown) {
            this.stateMacine.setState('walk');
        }
        this.jumpOnSpacePressed();
    }

    private walkOnEnter() {
        this.sprite.play('player-walk');
    }

    private walkOnUpdate() {
        this.walkOnArrowsKeysPressed();

        if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
            this.sprite.setVelocityX(0);
            this.stateMacine.setState('idle');
        }

        this.jumpOnSpacePressed();
    }

    private jumpOnEnter() {
        this.sprite.play('player-jump');
        this.sprite.setVelocityY(-12);
    }

    private jumpOnUpdate() {
        this.walkOnArrowsKeysPressed()
    }

    private walkOnArrowsKeysPressed() {
        let speed: number = 5;
        if (this.cursors.left.isDown) {
            this.sprite.flipX = true;
            this.sprite.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.sprite.flipX = false;
            this.sprite.setVelocityX(speed);
        }
    }

    private jumpOnSpacePressed() {
        let spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (spaceJustPressed) {
            this.stateMacine.setState('jump');
        }
    }

    private createAnimations() {
        this.sprite.anims.create({
            key: 'player-idle',
            frames: [{
                key: 'penguin',
                frame: 'penguin_walk01'
            }]
        })
        this.sprite.anims.create({
            key: 'player-walk',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('penguin', {
                start: 1,
                end: 4,
                prefix: 'penguin_walk0'
            }),
            repeat: -1
        });
        this.sprite.anims.create({
            key: 'player-jump',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('penguin', {
                start: 1,
                end: 3,
                prefix: 'penguin_jump0'
            }),
            repeat: -1
        });
    }
}