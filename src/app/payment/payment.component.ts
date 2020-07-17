import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {NgForm} from "@angular/forms";
import { environment } from 'src/environments/environment';
import { AngularStripeService } from '@fireflysemantics/angular-stripe-service';
import { Subscription } from 'rxjs';
import { take, map, tap, delay, switchMap, filter } from 'rxjs/operators';
import { AppserviceService } from '../appservice.service';


@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent {

  @ViewChild('cardInfo', { static: false }) cardInfo: ElementRef;

  title = 'stripeAngular';

  //Declare dummy data
  id: string = '123';
  name: string = 'powerbike';
  email: string = 'nelsob44@yahoo.com';
  price: number = 1200;
  currency: string = 'gbp';
  description: string = 'A very good bike';
  private paymentIntentSub: Subscription;

  stripe;
  loading = false;
  confirmation;
  clSecret: string = null;

  card: any;
  cardHandler = this.onChange.bind(this);
  error: string;

  constructor(
    private cd: ChangeDetectorRef,
    private appService: AppserviceService,
    private router: Router,
    private stripeService:AngularStripeService) {}

  ngAfterViewInit() {
    const stripePubKey = environment.publishableKeyStripe;
    this.stripeService.setPublishableKey(stripePubKey).then(
      stripe=> {
        this.stripe = stripe;
    const elements = stripe.elements();    
    this.card = elements.create('card');
    this.card.mount(this.cardInfo.nativeElement);
    this.card.addEventListener('change', this.cardHandler);
    });
  }

  
  onChange({ error }) {
    if (error) {
      this.error = error.message;
    } else {
      this.error = null;
    }
    this.cd.detectChanges();
  }

  async onSubmit(form: NgForm) {
    const { token, error } = await this.stripe.createToken(this.card);

    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Success!', token);
      await this.onClickStripe(form);
    }
  }

  onClickStripe(form: NgForm) {
    return this.paymentIntentSub = this.appService.addPaymentIntentStripe(
      this.id,
      this.name,
      this.email,
      this.price,
      this.currency,
      this.description
    ).pipe(
      switchMap(intent => {
        this.clSecret = intent.intent.client_secret;
        return this.appService.storePaymentIntent( 
          this.id, 
          this.name,
          this.email,
          this.price,
          this.currency,
          this.description,
          intent.intent.id    
        );
      })      
    ).subscribe(() => {
      this.stripe.confirmCardPayment(this.clSecret, {
        receipt_email: this.email,
          payment_method: {
            card: this.card,
            billing_details: {
              name: this.name,
              email: this.email
            }
          }
      }).then(res => {
        console.log(res);
        if(res.paymentIntent && res.paymentIntent.status === "succeeded") {
          alert('your payment was successful');
          form.reset();
          this.router.navigate(['/home']);
        } else {
          const errorCode = res.error.message;
          alert(errorCode);
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.paymentIntentSub) {
      this.paymentIntentSub.unsubscribe();      
    }
    this.card.removeEventListener('change', this.cardHandler);
    this.card.destroy();
  }
}
