class ResendProvider {

    constructor() {
        this.client = new Resend(process.env.RESEND_API_KEY);
    }

}

