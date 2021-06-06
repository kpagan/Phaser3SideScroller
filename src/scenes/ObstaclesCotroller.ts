export default class ObstaclesController {

        private obstacles = new Map<string, MatterJS.BodyType>();

        add(name: string, body: MatterJS.BodyType) {
            let key = this.createKey(name, body.id);
            if (this.obstacles.has(key)) {
                throw new Error('obstacle already exists at this key: ' + key);
            }
            this.obstacles.set(key, body);
        }

        is(name: string, body: MatterJS.BodyType) {
            let key = this.createKey(name, body.id);
            if (!this.obstacles.has(key)) {
                return false;
            }
            return true;
        }

        private createKey(name: string, id: number) {
            return `${name}-${id}`;
        }
}