import Phaser from 'phaser'
import PlayerController from './PlayerController';

export default class Game extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private penguin?: Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController;

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

                    this.playerController = new PlayerController(this.penguin, this.cursors);

                    this.cameras.main.startFollow(this.penguin);
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