import Phaser from 'phaser'
import ObstaclesController from './ObstaclesCotroller';
import PlayerController from './PlayerController';

export default class Game extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private penguin?: Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController;
    private obstacles!: ObstaclesController;

    constructor() {
        super('game');
    }

    init() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.obstacles = new ObstaclesController();
    }

    preload() {
        this.load.atlas('penguin', 'assets/penguin.png', 'assets/penguin.json');
        this.load.image('tiles', 'assets/sheet.png');
        this.load.tilemapTiledJSON('tilemap', 'assets/map.json');
        this.load.image('star', 'assets/star.png');
    }

    create() {
        this.scene.launch('ui');

        let map = this.make.tilemap({ key: 'tilemap' });
        let tileset = map.addTilesetImage('iceworld', 'tiles');
        let ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({ collides: true });

        map.createLayer('obstacles', tileset);

        this.matter.world.convertTilemapLayer(ground);
        this.cameras.main.scrollY = 300;

        let objectsLayer = map.getObjectLayer('objects');

        objectsLayer.objects.forEach(objData => {
            let { x = 0, y = 0, name, width = 0, height = 0 } = objData;
            switch (name) {
                case 'penguin-spawn': {
                    this.penguin = this.matter.add.sprite(x + (width * 0.5), y, 'penguin')
                        .play('player-idle')
                        .setFixedRotation();

                    this.playerController = new PlayerController(this, this.penguin, this.cursors, this.obstacles);

                    this.cameras.main.startFollow(this.penguin);
                    break;
                }
                case 'star': {
                    let star = this.matter.add.sprite(x, y, 'star', undefined, {
                        isStatic: true,
                        isSensor: true
                    });

                    star.setData('type', 'star');
                    break;
                }
                case 'spikes': {
                    let spike = this.matter.add.rectangle(x + (width * 0.5), y + (height * 0.5), width, height, {
                        isStatic: true
                    });
                    this.obstacles.add('spikes', spike);
                    break;
                }


            }
        })

    }



    update(t: number, dt: number) {
        if (!this.playerController) {
            return;
        }

        this.playerController.update(dt);
    }
}