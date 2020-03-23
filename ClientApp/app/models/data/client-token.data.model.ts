namespace Model.Data.Auth {
    export interface ClientToken {
        access_token: string;
        token_type: string;
        expires_in: any;
        refresh_token: string;
    }
}