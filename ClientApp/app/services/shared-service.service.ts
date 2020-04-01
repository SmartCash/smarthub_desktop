import { BaseLocalStorageService } from './base-localstore.service';
import { Observable } from 'rxjs/Rx';
import { TokenResponse } from '../models/response/token-response.model';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Http, Headers, ResponseContentType } from '@angular/http';
import { Util } from '../models/util';
import { User } from '../models/user.model';
import { CurrentPrice } from '../models/data/current-price.model';
import { Wallet } from '../models/data/walletv2.data.model';
import { RecoveryKey } from '../models/response/key-response.model';
import * as _ from 'lodash';
import { isPlatformBrowser } from '@angular/common';
import { saveAs } from 'file-saver';
import * as aes256 from 'aes256';
import { PrivateKeysGenerator } from '../pages/register/privatekeys.generator';

@Injectable()
export class SharedService {
    public http: Http;
    public sendTo: string | undefined;
    public refreshInterval: any;
    public dataStore: {
        wallet: Wallet[],
        user: User,
        currentPrice: any,
        recoveryKey: RecoveryKey,
        token: TokenResponse,
        isAuthenticated: boolean
    };

    constructor(
        private _http: Http,
        @Inject('BASE_URL') public baseUrl: string,
        private _baseStorage: BaseLocalStorageService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.http = _http;
        this.dataStore = {
            wallet: [],
            user: new User,
            currentPrice: [],
            recoveryKey: new RecoveryKey,
            token: new TokenResponse,
            isAuthenticated: false
        }
    }

    
    get wallet() {
        return this.dataStore.wallet;
    }

    get user() {
        return this.dataStore.user;
    }

    get recoveryKey() {
        return this.dataStore.recoveryKey;
    }

    get currentPrice() {
        return this.dataStore.currentPrice;
    }

    get token() {
        return this.dataStore.token;
    }

    get isAuthenticated() {
        return this.dataStore.isAuthenticated;
    }

    get isTokenValid() {
        return (
            Util.isValidObject(this.token) &&
            Util.isValidAndNotEmpty(this.token.access_token)
        );
    }

    get isProductionEnvironment() {
        return false;
        
    }
    

    async get(urlApi: string) {
        
        if (!this.isTokenValid) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        this.createAuthorizationHeader(h);

        let url = `${this.baseUrl}${urlApi}`;

        return await
            this.http
                .get(url, { headers: h! })
                .map((res) => {
                    
                    
                    return res.json();
                }).toPromise();
    }

    async get2(urlApi: string, withAutorization: boolean) {
        
        if (withAutorization && !this.isTokenValid) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        this.createAuthorizationHeader(h);

        let url = `${this.baseUrl}${urlApi}`;

        return await
            this.http
                .get(url, { headers: h! })
                .map((res) => {
                    return res.json();
                }).toPromise();
    }

    getObservable(urlApi: string, withAutorization: boolean) {
        
        if (withAutorization && !this.isTokenValid) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        if (withAutorization) {
            this.createAuthorizationHeader(h);
        }

        let url = `${this.baseUrl}${urlApi}`;

        return this.http
            .get(url, { headers: h! })
            .map((res) => {
                
                
                return res.json();
            });
    }

    async delete(urlApi: string, auth: boolean = true) {
        
        if (!this.isTokenValid && auth) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        this.createAuthorizationHeader(h);

        let url = `${this.baseUrl}${urlApi}`;

        return await
            this.http
                .delete(url, { headers: h! })
                .map((res) => {
                    return res.json();
                }).toPromise();
    }

    async put(urlApi: string, body: any) {
        
        if (!this.isTokenValid) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        this.createAuthorizationHeader(h);

        let url = `${this.baseUrl}${urlApi}`;

        return await
            this.http
                .put(url, body, { headers: h! })
                .map((res) => {
                    return res.json();
                }).toPromise();
    }

    async post(urlApi: string, body: any) {
        
        if (!this.isTokenValid) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        this.createAuthorizationHeader(h);
        
        let url = `${this.baseUrl}${urlApi}`;;

        return await
            this.http
                .post(url, body, { headers: h! })
                .map((res) => {
                    return res.json();
                }).toPromise();
    }

    async post2(urlApi: string, body: any, auth: boolean = true) {
        
        if (!this.isTokenValid && auth) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        this.createAuthorizationHeader(h);

        let url = `${this.baseUrl}${urlApi}`;

        return await
            this.http
                .post(url, body, { headers: h! })
                .map((res) => {
                    return res.json();
                }).toPromise();
    }

    postReturnBinary(urlApi: string, body: any, auth: boolean = true) {
        
        if (!this.isTokenValid && auth) {
            console.log("The token does not exists or it is invalid!");
            return null;
        }

        let h = new Headers();
        this.createAuthorizationHeader(h);

        let url = `${this.baseUrl}${urlApi}`;

        return this.http
            .post(url, body, {
                headers: h!,
                responseType: ResponseContentType.Blob,
            })
            .map(res => {
                return res.blob();
            }).toPromise().then(res => saveAs(res, "SmartCard.pkpass"));
    }

    
    private createAuthorizationHeader(headers: Headers) {
        try {
            if (this.isTokenValid)
                headers.append('Authorization', 'Bearer ' + this.token.access_token);
        } catch (e) {
            console.log("createAuthorizationHeader :: ERROR");
            console.log(e);
        }
    }

    public logout() {
        this.cacheRemove(`${this.baseUrl}api/User/GetInfoWithKey`);
        this.cacheRemove(`${this.baseUrl}api/Login/GetClientToken`);
        this.dataStore = {
            wallet: [],
            user: new User,
            currentPrice: new CurrentPrice,
            recoveryKey: new RecoveryKey,
            token: new TokenResponse,
            isAuthenticated: false
        }
    }

    public getWalletByAddress(address: string): Wallet | undefined {
        return _.find(this.wallet, ['address', address]);
    }

    async exportPrivateKeys(privateKeyResponse: any, username: any, recoveryKey: any) {
        PrivateKeysGenerator.generate(privateKeyResponse, username, recoveryKey);
        // let content = await this.prepareToCsvPrivateKeys(privateKeyResponse, username);
        // await this.download(content, `privateKeys_${username}.txt`, 'text/plain');
        // return content;
    }

    async prepareToCsvPrivateKeys(privateKeyResponse: any, username: any) {
        
        
        if (!Util.isValidObject(privateKeyResponse)) {
            console.log("Error to export the private key");
            return;
        }
        var breakLine = '\r\n'
        let headerCsv = `index,address,privateKey` + breakLine;
        
        let dataCsv = "";
        for (let i = 0; i < privateKeyResponse.data.length; i++) {
            dataCsv += `${privateKeyResponse.data[i].index},${privateKeyResponse.data[i].address},${privateKeyResponse.data[i].privateKey}` + breakLine;
            
        }

        
        let concatedData = headerCsv + dataCsv;
        return concatedData;
    }

    async prepareToCsvRecoveryKey() {
        let headerCsv = `Master Security Code\n`;
        let dataCsv = `${this.recoveryKey.recoveryKey}`;
        let concatedData = headerCsv + dataCsv;
        return concatedData;
    }

    async exportRecoveryKey() {
        await this.download(await this.prepareToCsvRecoveryKey(), 'recoveryKey.txt', 'text/plain');
    }

    async download(text: any, name: string, type: string) {
        if (isPlatformBrowser(this.platformId)) {
            var blob = new Blob([text], { type: type });
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = name;
            link.click();
        }
    }

    cacheGetWithoutTime(url: string): Observable<any> {
        let item = this._baseStorage.getItemWithoutTime(url);
        if (Util.isValidObject(item))
            return Observable.of(item);
        return null!;
    }
    
    cacheGet(url: string): Observable<any> {
        let item = this._baseStorage.getItem(url);
        if (Util.isValidObject(item))
            return Observable.of(item);
        return null!;
    }

    cacheIt(obj: any, url: string) {
        return this._baseStorage.setItem(url, obj);
    }

    cacheRemove(url: string) {
        return this._baseStorage.removeItem(url);
    }

    updateWalletBalance() {
        const getBalances = async () => {
            const wallets = this.wallet.map(wallet => wallet.address);
            const balances = await this.post(`api/wallet/balances`, wallets);
            
            this.wallet.filter(wallet => {
                const balance = balances.find((b: any) => b.address === wallet.address);
                wallet = Object.assign(wallet, balance);
            });
        }
        getBalances();
    }

    updateGetInfo(response: any, secretKey: string) {
        const getInfoWithKeyCacheName = `${this.baseUrl}api/User/GetInfoWithKey`;
        response.data.wallet.forEach((wallet: any) => {
            if (wallet && wallet.key) {
                wallet.key = aes256.encrypt(secretKey, wallet.key);
            }
        });
        this.cacheIt(response.data, getInfoWithKeyCacheName);
        this.cacheIt(response.data, getInfoWithKeyCacheName);
        this.dataStore.user = User.map(response.data);
        this.dataStore.wallet = Wallet.map(response.data.wallet);
        this.updateWalletBalance();
    }
}