import { Airliner, AirplaneCategorySize } from "./AirplaneServices";

export class Airplane {

    airliner: Airliner;
    categorySize: AirplaneCategorySize;
    icon: string;
    icon_shadow: string;
    name: string;
    id: string;

    constructor(_id : string) {
        this.id = _id;
    }


}