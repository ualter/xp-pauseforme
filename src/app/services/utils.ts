import { Injectable } from '@angular/core';

export enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    OFF
  }

@Injectable()
export class Utils {

    level: LogLevel = LogLevel.DEBUG;

    monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    shortMonthNames = [
        "Jan", "Feb", "Mar",
        "Apr", "May", "Jun", "Jul",
        "Aug", "Sep", "Oct",
        "Nov", "Dec"
    ];

    constructor() {
    }

    formatDateToday() {
        return this.formatDate(new Date());
    }

    formatDate(_date) {
        var day        = _date.getDate();
        var monthIndex = _date.getMonth();
        var year       = _date.getFullYear();
        return year + "/" + this.shortMonthNames[monthIndex] + "/" + day;
    }

    isJsonMessage(_message) {
        if (/^[\],:{}\s]*$/.test(_message.replace(/\\["\\\/bfnrtu]/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
          return true;
        }
        return false;
    }

    private writeLog(msg, logLevel: LogLevel, _object?: object) {
        var logMsg = "[" + 
                     LogLevel[logLevel] + 
                     "] " + 
                     this.formatDateToday() + 
                     ": " + 
                     msg;
        if ( _object != undefined ) {
            logMsg += " ...(cont. next line)..."
        }
        console.log(logMsg);
        if ( _object != undefined ) {
            console.log(_object);
        }
    }

    trace(msg, _object?: object) {
        if ( this.level == LogLevel.TRACE ) {
            this.writeLog(msg, LogLevel.TRACE, _object);
        }
    }

    debug(msg, _object?: object) {
        if ( this.level <= LogLevel.DEBUG ) {
            this.writeLog(msg, LogLevel.DEBUG, _object);
        }
    }

    info(msg, _object?: object) {
        if ( this.level <= LogLevel.INFO ) {
            this.writeLog(msg, LogLevel.INFO, _object);
        }
    }
    

    warn(msg, _object?: object) {
        if ( this.level <= LogLevel.WARN ) {
            this.writeLog(msg, LogLevel.WARN, _object);
        }
    }

    error(msg, _object?: object) {
        if ( this.level >= LogLevel.ERROR ) {
            this.writeLog(msg, LogLevel.ERROR, _object);
        }
    }

}