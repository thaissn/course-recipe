import unique from 'unique';

export default class List {
    constructor() {
        this.items = [];
    }

    addItem (count, unit, ingredient) {
        const item = {
            id: unique(),
            count,
            unit,
            ingredient
        }
        this.items.push(item);
        return item;
    }

    deleteItem(id) {
        const index = this.items.findIndex(el => el.id === parseInt(id, 10));
        this.items.splice(index, 1);
    }

    updateCount(id, newCount) {
        if (newCount > 1) {
            this.items.find(el => el.id === parseInt(id, 10)).count = newCount;
        }
    }
}