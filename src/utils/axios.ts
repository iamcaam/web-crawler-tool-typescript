import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import qs from "qs";

export enum RequestType {
    get,
    post,
    delete,
    put,
    patch,
    head,
    request,
    options
}

export interface RequestConfig{
    url              : string; // 只有此為必需
    method          ?: string; // get, post, delete...，大小寫皆可
    headers         ?: object; // 如 { 'Content-Type': 'application/json' }    
    baseURL         ?: string; // ex: http://localhost:3000，添加在url前面，除非 url 為絕對路徑   
    data            ?: object; // ex: { name: 'test', title: 777 }，主要傳送的資料 (只用於 PUT、POST、PATCH )，在沒有 transformRequest 情況下資料型別有限制
    params          ?: object; // ex: { ID: 123 }，params 注意此不等同於 data，此為 URL 上要代的參數   ~url?ID=123    
    maxContentLength?: number; // 限制傳送大小        
    timeout         ?: number; // 請求時間超過 1000毫秒(1秒)，請求會被中止
    responseType    ?: string; // 伺服器回應的數據類型，瀏覽器才有'blob'，預設為 'json'；選項: 'arraybuffer', 'document', 'json', 'text', 'stream'   
    responseEncoding?: string;  // 伺服器回應的編碼模式 預設 'utf8'
    paramsSerializer?:(params: RequestConfig['params']) => object;
        // // 序列化參數 ???
    // paramsSerializer: function(params) {
    //   return Qs.stringify(params, {arrayFormat: 'brackets'})
    // },
    // // 在上傳、下載途中可執行的事情 (progressBar、Loading)
    // onUploadProgress(progressEvt) { /* 原生 ProgressEvent */  },
    // onDownloadProgress(progressEvt) { /* 原生 ProgressEvent */ },

    // // 允許自定義處理請求，可讓測試更容易 (有看沒懂..)
    // // return promise 並提供有效的回應 (valid response)
    // adapter (config) { /* 下方章節 補充詳細用法 */ },
}

/**
 * 以axios在封裝一層Promise方法，可用於請求並接收目標網址的資料
 * @param url 請求的Url網址
 * @param reqType Request類型，如Get, Post, Put...
 * @param data 請求所帶資料
 * @param config axios所用的Request Config
 * @returns Reponse Object
 */
export const reqApi = async (url: string, reqType?: RequestType, data?: object, config?: AxiosRequestConfig):Promise<AxiosResponse<any, any>> => {
    return new Promise(async (resolve, reject) => {
        try {
            let response: AxiosResponse<any, any>;

            switch(reqType) {
                case RequestType.get:
                    response = await axios.get(url, config);
                    break;
                case RequestType.post:
                    response = await axios.post(url, data, config);
                    break;
                case RequestType.delete:
                    response = await axios.delete(url, config);
                    break;
                case RequestType.put:
                    response = await axios.put(url, data, config);
                    break;
                case RequestType.patch:
                    response = await axios.patch(url, data, config);
                    break;
                case RequestType.head: // 功能與 GET 相同，但無 response body
                    response = await axios.head(url, config);
                    break;
                case RequestType.options:  // 用來發送探測請求，確認該地址採用的協定、要求的表頭
                    response = await axios.head(url, config); // 預先檢查發送的請求是否安全
                    break;                    
                default:
                    response = await axios.get(url, config);
                    break;  
                    // response = await axios.request(config);
            }
            
            // console.log("response");
            // console.log(response);
            resolve(response);
        } catch (error) {
            console.log("error");
            reject(error);
        }
    });
}


export const get = async (url: string): Promise<AxiosResponse<any, any>> => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(url);
            resolve(response);
        } catch (error) {
            reject(error);
        }
    });
}

export const post = async (url: string): Promise<AxiosResponse<any, any>> => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.post(url);
            resolve(response);
        } catch (error) {
            reject(error);
        }
    });
}

// reqApi('https://scrapeme.live/shop/') 
// 	.then(({ data }) => console.log("YAYAYA"));