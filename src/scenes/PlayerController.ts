import Phaser, { Physics } from 'phaser'
import StateMachine from '../statemachine/StateMachine';
import { sharedInstance as events } from './EventCenter'
import ObstaclesController from './ObstaclesCotroller';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
type Sprite = Phaser.Physics.Matter.Sprite;

export default class PlayerController {
    private scene: Phaser.Scene;
    private sprite: Sprite;
    private cursors: CursorKeys;
    private obstacles: ObstaclesController;
    private stateMacine: StateMachine

    private health: number = 100;

    private lastSnowman?: Sprite;

    constructor(scene: Phaser.Scene, sprite: Sprite, cursors: CursorKeys, obstacles: ObstaclesController) {
        this.scene = scene;
        this.sprite = sprite;
        this.cursors = cursors;
        this.obstacles = obstacles;

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
            .addState('spike-hit', {
                onEnter: this.spikeHitOnEnter
            })
            .addState('snowman-hit', {
                onEnter: this.snowmanHitOnEnter
            })
            .addState('snowman-stomp', {
                onEnter: this.snowmanStompOnEnter
            })
            .addState('dead', {
                onEnter: this.deadOnEnter
            })
            .setState('idle');

        this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
            let body = data.bodyB as MatterJS.BodyType;
            if (this.obstacles.is('spikes', body)) {
                this.stateMacine.setState('spike-hit');
                return;
            }

            if (this.obstacles.is('snowman', body)) {
                this.lastSnowman = body.gameObject;
                if (this.sprite.y < body.position.y) {
                    this.stateMacine.setState('snowman-stomp');
                } else {
                    this.stateMacine.setState('snowman-hit');
                }
                return;
            }

            let gameObject = body.gameObject;

            if (!gameObject) {
                return;
            }

            if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
                if (this.stateMacine.isCurrentState('jump')) {
                    this.stateMacine.setState('idle');
                }
                return;
            }

            let sprite = gameObject as Phaser.Physics.Matter.Sprite;
            let type = sprite.getData('type');

            switch (type) {
                case 'star': {
                    events.emit('star-collected');
                    sprite.destroy();
                    break;
                }
                case 'health': {
                    let value = sprite.getData('healthPoints') ?? 10;
                    this.health = Phaser.Math.Clamp(this.health + value, 0, 100);
                    events.emit('health-changed', this.health);
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
        this.walkOnArrowsKeysPressed();
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

    private spikeHitOnEnter() {
        this.sprite.setVelocityY(-12);
        this.penguinGotHit(0xff0000);
    }

    private snowmanHitOnEnter() {
        if (this.lastSnowman) {
            if (this.sprite.x < this.lastSnowman.x) { 
                this.sprite.setVelocityX(-20);
            } else {
                this.sprite.setVelocityX(20);
            }
        } else {
            this.sprite.setVelocityY(-20);
        }

        this.penguinGotHit(0x0000ff);
    }

    private penguinGotHit(tintHexColor: number) {
        let startColor = Phaser.Display.Color.ValueToColor(0xffffff);
        let endColor = Phaser.Display.Color.ValueToColor(tintHexColor);

        this.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 100,
            repeat: 2,
            yoyo: true,
            ease: Phaser.Math.Easing.Sine.InOut,
            onUpdate: tween => {
                let value = tween.getValue();
                let colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                    startColor,
                    endColor,
                    100,
                    value
                );

                let color = Phaser.Display.Color.GetColor(colorObject.r, colorObject.g, colorObject.b);

                this.sprite.setTint(color);
            }
        });
        this.stateMacine.setState('idle');
        this.setHealth(this.health - 10);
    }

    private setHealth(value: number) {
        this.health = Phaser.Math.Clamp(value, 0, 100);
        events.emit('health-changed', this.health);
        if (this.health <= 0) {
            this.stateMacine.setState('dead');
        }
    }

    private snowmanStompOnEnter() {
        this.sprite.setVelocityY(-10);

        events.emit('snowman-stomped', this.lastSnowman);

        this.stateMacine.setState('idle');

    }

    private deadOnEnter() {
        this.sprite.play('player-death');
        this.sprite.setOnCollide(() => {});
        this.scene.time.delayedCall(1500, () => {
            this.scene.scene.start('game-over');
        });
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

        this.sprite.anims.create({
            key: 'player-death',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('penguin', {
                start: 1,
                end: 4,
                prefix: 'penguin_die',
                zeroPad: 2
            })
        });
    }
}