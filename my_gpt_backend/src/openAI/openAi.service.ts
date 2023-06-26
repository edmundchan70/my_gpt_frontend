import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from "openai";
import "@tensorflow/tfjs-backend-cpu";
import { chat_message } from '../DTO/openAI/chat_message.dto';
import { text_chunk } from 'src/DTO/doc_query/text_chunk.dto';
import { text_chunk_toString } from './util/text_chunk_toString';
 
 
@Injectable()
export class openAiService {
    private config: Configuration;
    private openai: OpenAIApi;  
    async chat(query:string,data:string,API_KEY: string){
        this.config = new Configuration({
            organization: "org-EVepSWx7EGMJzKHT3eCJVvb4",
            apiKey:API_KEY,
        });
        this.openai = new OpenAIApi(this.config);
        const messag_dto : chat_message[] =[{
            role:"system",
            content: "Remeber the following data and use them to answer user question: "+data
        },
        {
            role: "user",
            content: query
        }]  
        console.log("message: " ,messag_dto );
        const resp =  await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages:messag_dto,
            temperature:0.8
        });
        return resp.data;
    }
      
}


 