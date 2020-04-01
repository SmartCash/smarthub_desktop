import { ElementRef, Injectable } from '@angular/core';
import * as store from 'store';

@Injectable()
export class Util {
    public static isValidObject(obj: any) {
        return (obj !== undefined && typeof obj !== 'undefined' && obj !== null && obj !== {} && Object.keys(obj).length > 0);
    }
    public static isValidAndNotEmpty(obj: any) {
        return (this.isValidObject(obj) && obj !== '');
    }
    public static isValidAndGreaterThanZero(obj: any) {
        return (this.isValidObject(obj) && obj > 0);
    }
    public static howLongAGo(time: any): number {
        return new Date(new Date().getTime() - new Date(time).getTime()).getMinutes();
    }
    public static generateGUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    public static getGUID() {
        if (!store.get('SCExchange_GUID')) {
            store.set('SCExchange_GUID', this.generateGUID());
        }
        return store.get('SCExchange_GUID');
    }
    public static trackByFn(index: any, item: any) {
        return item.value;
    }
    public static setButtonAsWaitState(button: ElementRef) {
        if (button.nativeElement !== null) {
            const htmlElement = button.nativeElement as HTMLElement;
            htmlElement.setAttribute('disabled', 'disabled');
            htmlElement.setAttribute('data-value', htmlElement.innerHTML);
            htmlElement.innerHTML = '<i class="icon-spinner icon-spin"></i>';
        }
    }
    public static setButtonAsReadyState(button: ElementRef) {
        if (button && button.nativeElement !== null) {
            const htmlElement = button.nativeElement as HTMLElement;
            htmlElement.innerHTML = htmlElement.getAttribute('data-value') as string;
            htmlElement.removeAttribute('disabled');
        }
    }
}