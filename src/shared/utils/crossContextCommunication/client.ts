import { ResponseBody } from "../types"
import { v4 as uuid4 } from 'uuid'
import { createLogger } from '../logger'

const logger = createLogger('Client')

/** Util func. */
const sendEvent = (eventName: string, detail: any) => {
    const event = new CustomEvent(eventName, { detail })
    document.dispatchEvent(event)
  }
export class Client {
    url: string
  
    constructor(url: string) {
      this.url = url
      logger.info('Client initialized', { data: { url } })
    }
  
  
    public send<ResponseData = any>(
      methodName: string,
      data?: any,
      timeout: number = 5000
    ): Promise<ResponseBody<ResponseData>> {
      const requestId = uuid4()
      logger.info(`Sending request: ${methodName}`, { 
        data: { 
          requestId: requestId.substring(0, 8),
          hasData: !!data,
          timeout 
        } 
      })
      
      return new Promise<ResponseBody<ResponseData>>((resolve, reject) => {
        // setup ResponseEvent listener and
        function eventHandler(event: CustomEvent) {
          document.removeEventListener(requestId, eventHandler)
          const response = event.detail
          if (response.ok) {
            logger.success(`Response received: ${methodName}`, { data: { hasData: !!response.data } })
          } else {
            logger.error(`Request failed: ${methodName}`, response.data)
          }
          resolve(response)
        }
        document.addEventListener(requestId, eventHandler)
  
        // send RequestEvent
        this.sendRequest(requestId, methodName, data)
  
        // timeout
        setTimeout(() => {
          document.removeEventListener(requestId, eventHandler)
          logger.error(`Request timeout: ${methodName}`, { data: { timeout } })
          reject(new Error(`Timeout: ${timeout} ms`))
        }, timeout)
      })
    }
  
    private sendRequest(requestId: string, methodName: string, data?: any) {
      sendEvent(this.url, { requestId, methodName, data })
    }
  }
  