import Phaser from 'phaser'
import { sharedInstance as events } from './EventCenter'

export default class UI extends Phaser.Scene {

    private starsLabel!: Phaser.GameObjects.Text;
    private starsCollected = 0;

    constructor() {
        super('ui');
    }

    init() {
        this.starsCollected = 0;
    }

    create() {
        this.starsLabel = this.add.text(10, 10, 'Stars: 0', {
            fontSize: '32px'
        });

        events.on('star-collected', this.handleStarCollected, this);

        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            events.off('star-collected', this.handleStarCollected, this);
        });
    }

    private handleStarCollected() {
        ++this.starsCollected;
        this.starsLabel.text = `Stars: ${this.starsCollected}`;

    }

    update() {
    }
}