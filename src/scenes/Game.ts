import Phaser from 'phaser'

export default class Game extends Phaser.Scene {

    constructor() {
        super('game');
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

        this.cameras.main.scrollY = 300;
    }

    update() {
    }
}