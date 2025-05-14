export class LogService {
    constructor() {}
    log(message: string) {
        console.log(message);
    }
}

export const logService = new LogService();
