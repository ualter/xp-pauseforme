import { Injectable } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { Utils } from './Utils';

@Injectable()
export class XpWebSocketService {

  private subject: Rx.Subject<MessageEvent>;
  private ws : any;
  
  constructor(private utils: Utils) { 
  }

  public connect(url: string) {
    this.subject = this.create(url);
    return this.subject;
  }

  private create(url): Rx.Subject<MessageEvent> {
    try {
      this.ws = new WebSocket(url);
    } catch (error) {
      console.log(error);
    }

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
        } else {
          this.utils.info("WS readyState ==" + this.ws.readyState);
        }
      },
      error: (data: Object) => {
        this.utils.error("ERROR..:" + data);
        return this.ws.error;
      },
      complete: (data: Object) => {
        this.utils.info("CLOSED..:" + data);
      }
    }
    return Rx.Subject.create(observer, observable);
  }

  public observable() {
    return this.subject;
  }

  public getWebSocket() {
    return this.ws;
  }

  public disconnect() {
    if ( this.ws ) {
      this.utils.info("Closing connection...");
      this.ws.close();
      this.ws = null;
    }
  }


}