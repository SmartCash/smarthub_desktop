import { BaseLocalStorageService } from './base-localstore.service';
import { SharedService } from './shared-service.service';
import { Injectable, Inject } from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Util } from "../models/util";

@Injectable()
export class CurrentPriceService {
  constructor(protected baseStorage: BaseLocalStorageService, private _shared: SharedService, @Inject('BASE_URL') public baseUrl: string) {
  }

  async getObservableServerCurrentPrice() {
    if (!Util.isValidObject(this._shared.dataStore.currentPrice)) {
      let url = `${this.baseUrl}api/wallet/getcurrentprice`;
      this._shared.dataStore.currentPrice = await
        this._shared.http
          .get(url)
          .map((res) => {
            var json = res.json();
            console.log(json);
            var model = [{
              price_usd: json.items[0].smartcash.usd.toString(),
              price_btc: json.items[0].smartcash.btc.toString(),
            }];

            this._shared.dataStore.currentPrice = model;
            return model;
          }).toPromise();
    }
    return this._shared.dataStore.currentPrice;
  }

  async getCurrentPriceInExchange() {
    let url = `${this.baseUrl}api/wallet/getcurrentpricewithcoin`;

    return await new Promise<number>((resolve, reject) => {
      $.get(url).done((data) => {
        resolve(data);
      }).fail((err) => {
        reject(err);
      });
    });
  }
}