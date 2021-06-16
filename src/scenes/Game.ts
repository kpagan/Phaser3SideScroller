import Phaser from 'phaser'
import ObstaclesController from './ObstaclesCotroller';
import PlayerController from './PlayerController';
import SnowmanController from './SnowmanController';

export default class Game extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private penguin?: Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController;
    private obstacles!: ObstaclesController;
    private snowmen: SnowmanController[] = [];

    constructor() {
        super('game');
    }

    init() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.obstacles = new ObstaclesController();
        this.snowmen = [];

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.destroy();
        });
    }

    preload() {
        this.load.atlas('penguin', 'assets/penguin.png', 'assets/penguin.json');
        this.load.image('tiles', 'assets/sheet.png');
        this.load.tilemapTiledJSON('tilemap', 'assets/map.json');
        this.load.image('star', 'assets/star.png');
        this.load.image('health', 'assets/health.png');
        this.load.atlas('snowman', 'assets/snowman.png', 'assets/snowman.json');
    }

    create() {
        this.scene.launch('ui');

        let map = this.make.tilemap({ key: 'tilemap' });
        let tileset = map.addTilesetImage('iceworld', 'tiles');
        let ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({ collides: true });

        map.createLayer('obstacles', tileset);
        let objectsLayer = map.getObjectLayer('objects');

        objectsLayer.objects.forEach(objData => {
            let { x = 0, y = 0, name, width = 0, height = 0 } = objData;
            switch (name) {
                case 'penguin-spawn': {
                    this.penguin = this.matter.add.sprite(x + (width * 0.5), y, 'penguin')
                        .setFixedRotation();

                    this.playerController = new PlayerController(this, this.penguin, this.cursors, this.obstacles);

                    this.cameras.main.startFollow(this.penguin, true);
                    break;
                }
                case 'snowman': {
                    let snowman = this.matter.add.sprite(x, y, 'snowman')
                        .setFixedRotation();

                    this.snowmen.push(new SnowmanController(this, snowman));
                    this.obstacles.add('snowman', snowman.body as MatterJS.BodyType)
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
                case 'health': {
                    let health = this.matter.add.sprite(x, y, 'health', undefined, {
                        isStatic: true,
                        isSensor: true
                    });
                    health.setData('type', 'health');
                    health.setData('healthPoints', 10);
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
        });
        // this line below needs for some reason to be under the creation of objects otherwise 
        // when jumping will not be able to go back to idle state. WTF??????
        this.matter.world.convertTilemapLayer(ground);
    }

    destroy() {
        this.scene.stop('ui');
        this.snowmen.forEach(snowman => snowman.destroy());
    }

    update(t: number, dt: number) {
        this.playerController?.update(dt);
        this.snowmen.forEach(snowman => snowman.update(dt));
    }
}