import { Component } from '@angular/core';
import { SharedService } from '../../../services/shared-service.service';
import { UserService } from '../../../services/user.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'configure-scheduled-payment',
    styleUrls: ['./configure-scheduled-payment.css'],
    templateUrl: './configure-scheduled-payment.html'
})

export class ConfigureScheduledPayment {
    public configuring = false;
    public configureRequest = {
        userKey: ''
    };

    constructor(private _shared: SharedService, private _user: UserService) { }

    configureScheduledPayment() {
        this._shared.post('api/scheduledpayments/configurescheduled', this.configureRequest)
            .then((response: any) => {
                const swaloptions = {
                    customClass: 'animated fadeInDown',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    timer: 3000
                };
                if (!response.isValid) {
                    const swalError = Object.assign({
                        type: 'warning',
                        text: response.error.message || response.error.Message,
                    }, swaloptions);
                    Swal(swalError);
                    return;
                }
                const swalSuccess = Object.assign({
                    type: 'success',
                    text: 'Your Scheduled Payment Wallet has been configured',
                }, swaloptions);
                Swal(swalSuccess).then(async (result: any) => {
                    await this._user.getUser({ password: "" });
                });
            });
    }
}