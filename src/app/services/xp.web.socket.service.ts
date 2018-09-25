import { Injectable } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { Utils } from './utils';

@Injectable()
export class XpWebSocketService {

  private subject: Rx.Subject<MessageEvent>;
  private ws : any;
  
  constructor(private utils: Utils) { 
  }

  public connect(url: string) {
    if (!this.subject) {
      this.subject = this.create(url);
      this.utils.info("Successfully connected: " + url);
    } 
    return this.subject;
  }

  private create(url): Rx.Subject<MessageEvent> {
    this.ws = new WebSocket(url);

    let observable = Rx.Observable.create( 
      (obs : Rx.Observer<MessageEvent>) =>  {
         this.ws.onmessage = obs.next.bind(obs);
         this.ws.onerror = obs.error.bind(obs);
         this.ws.onclose = obs.complete.bind(obs);
         return this.ws.close.bind(this.ws);
      }
    );

    let observer = {
      next: (data: Object) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        }
      }/*,
      //error: (data: object) => {
      }*/
    }
    return Rx.Subject.create(observer, observable);
  }

  public observable() {
    return this.subject;
  }

  public getWebSocket() {
    return this.ws;
  }


}