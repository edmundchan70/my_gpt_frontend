import React, { useEffect, useRef, useState } from 'react'
import AI_ICON from "../../assets/AI_ICON.jpeg" 
import USER_ICON from "../../assets/USER_ICON.jpeg" 
import {AiOutlineSend} from "react-icons/ai"
import {  ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts';

import {  Message } from '../DTO/Types';
import { Conversation } from '../Conversation/Conversation.class';
import { OpenAI } from "langchain/llms/openai"
import { ConversationSummaryMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
type Props = {
  chain_obj : Conversation
}
function Message_container({chain_obj} : Props) {
 /*
  useEffect(() => {
    let initializedChain: Chain | null = null;
    // Check the config.chain_type value and set the corresponding chain
    switch (config.chain_type) {
      case "ConversationalRetrievalQAChain":
        //initializedChain = new ConversationalRetrievalQAChain({prompt:static_prompt,memory:config.memory});
        break;
      case "LLMChain":
      //  initializedChain = new LLMChain({ ...config.chain_config });
        break;
      case "MapReduceDocumentsChain":
       // initializedChain = new MapReduceDocumentsChain({ ...config.chain_config });
        break;
      case "RefineDocumentsChain":
       // initializedChain = new RefineDocumentsChain({ ...config.chain_config });
        break;
      case "RetrievalQAChain":
       // initializedChain = new RetrievalQAChain({ ...config.chain_config });
        break;
      case "StuffDocumentsChain":
       // initializedChain = new StuffDocumentsChain({ ...config.chain_config });
        break;
      default:
        // Set a default chain if no matching chain type is found
        initializedChain = new LLMChain(new LLMChain({llm:config.model,prompt:static_prompt,memory:config.memory}));
        break;
    }

    set_chain(initializedChain);
  }, [config]);
  **/
  const testMessage  : Message[]  = [{
      send_time:  new Date(), 
      msg: "HELLo, AI",
      sender:"user"
  },
  {
      send_time:  new Date(),
      msg: "HELLo, human",
      sender:"AI"
  }
  ]
  /* unstable respond type 
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(config.prompt_template),
    new MessagesPlaceholder("chat_history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    
  ])*/
  /**
   * 1. Chain.run()
   * 2. load memory()
   * 
   */
  //default set to ConversationChain 
  const [msg_list, set_msg_list] = useState<Message[]>([])
  const userInput = useRef<HTMLInputElement | null>(null);
  const getInput = async () =>{
    if(!userInput.current)
      alert("Please enter something!")
    const user_msg : Message ={
      send_time : new Date(),
      msg: userInput.current!.value ,
      sender: "user"
    }
    console.log(chain_obj)
    console.log(userInput.current!.value)
    const api_key = localStorage.getItem('api_key')!
    const TEMPLATE_PROMPT =`The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know. Current conversation: {{chat_history}}, Human: {{input}}`
    const model = new OpenAI({temperature: 1.0 , openAIApiKey: api_key,verbose:true,modelName:"gpt-3.5-turbo"})
    const prompt =  new PromptTemplate({template:TEMPLATE_PROMPT,inputVariables:["input"],})
    //hardcode chain 
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        "You are a helpful assistant that try your best to help human ."
      ),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]);
    const memory =  new ConversationSummaryMemory({llm:model,memoryKey:"chat_history"})
    const chain =  new ConversationChain({llm:model,prompt:chatPrompt ,memory:memory})
    const resp= await chain.call({input: userInput.current!.value})
   // const resp =  await chain_obj.call_chain(userInput.current!.value)
    //might need error control here
    console.log(resp);
    const data = resp.text
    console.log("llm resp: " ,resp.text)
    const ai_msg :Message ={
      send_time: new Date(),
      msg :data,
      sender: 'AI'
    }
    //update memory
   // chain_obj.load_memory()
    set_msg_list((prev)=>[
      ...prev,user_msg,ai_msg
    ])
    //clean up input 
    
    userInput.current!.value = "";
  }
  return (
    <div >
        {msg_list?.map(
          (msg: Message) =>{ 
            return (
                <div className='flex space-x-52 '>
                    <img src={msg.sender==="AI"? AI_ICON  :USER_ICON  }  className='w-14 '/>
                    <h5>{msg.msg}</h5>
                </div>
            )
          })}
         <div>
               <label className="flex items-center" > Enter your message here: 
                <div className='border-slate-50 ml-3.5 border-2 rounded'>
                      <input ref={userInput}  className='bg-slate-600'  type="text" placeholder='Enter your prompt'/> 
                    <button onClick={getInput}  type='submit'><AiOutlineSend /></button>
                </div>
               </label> 
          </div>
        
    </div>
  )
}

export default Message_container