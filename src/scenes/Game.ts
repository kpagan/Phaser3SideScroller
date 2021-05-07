import Phaser from 'phaser'

export default class Game extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private penguin?: Phaser.Physics.Matter.Sprite;
    private isTouchingGround: boolean = false;

    constructor() {
        super('game');
    }

    init() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    preload() {
        this.load.atlas('penguin', 'assets/penguin.png', 'assets/penguin.json');
        this.load.image('tiles', 'assets/sheet.png');
        this.load.tilemapTiledJSON('tilemap', 'assets/map.json');
    }

    create() {
        this.createPenguinAnimations();
        let map = this.make.tilemap({ key: 'tilemap' });
        let tileset = map.addTilesetImage('iceworld', 'tiles');
        let ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({ collides: true });

        
        this.matter.world.convertTilemapLayer(ground);
        this.cameras.main.scrollY = 300;
        
        let objectsLayer = map.getObjectLayer('objects');
        
        objectsLayer.objects.forEach(objData => {
            let {x = 0, y = 0, name, width = 0} = objData;
            switch (name) {
                case 'penguin-spawn': {
                    this.penguin = this.matter.add.sprite(x + (width * 0.5), y, 'penguin')
                    .play('player-idle')
                    .setFixedRotation();
                    
                    this.penguin.setOnCollide((data: MatterJS.ICollisionPair) => {
                        this.isTouchingGround = true;
                    });
                    this.cameras.main.startFollow(this.penguin);
                    break;
                }

            }
        })
        
    }

    private createPenguinAnimations() {
        this.anims.create({
            key: 'player-idle',
            frames: [{ 
                key: 'penguin',
                frame: 'penguin_walk01'
            }]
        })
        this.anims.create({
            key: 'player-walk',
            frameRate: 10,
            frames: this.anims.generateFrameNames('penguin', { 
                start: 1, 
                end: 4, 
                prefix: 'penguin_walk0'
            }),
            repeat: -1
        });
    }

    update() {
        if (!this.penguin) {
            return;
        }

        let speed: number = 5;
        if (this.cursors.left.isDown) {
            this.penguin.flipX = true;
            this.penguin.setVelocityX(-speed);
            this.penguin.play('player-walk', true)
        } else if (this.cursors.right.isDown) {
            this.penguin.flipX = false;
            this.penguin.setVelocityX(speed);
            this.penguin.play('player-walk', true)
        } else {
            this.penguin.setVelocityX(0);
            this.penguin.play('player-idle', true)
        }

        let spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (spaceJustPressed && this.isTouchingGround) {
            this.penguin.setVelocityY(-12);
            this.isTouchingGround = false;
        }
        
    }
}