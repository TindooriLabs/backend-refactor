import { getUserChatsWithLastMessage, getUserNames } from "../database/queries/users.js";

const getChatsWithUserNames = (arr) => {
const promises = arr.map(async (chat) => {
  let chatResult = {};
  const participantIds = chat.participants.map((p)=>{
    return p.id;
  });
 
  const participantNames = await getUserNames(participantIds);
  chatResult.participants = participantNames.map((p)=>{
    return {id: p.userId, name: p.firstName}
  });
  chatResult.id = chat.id;
  if(chat.messages.length > 0){
  chatResult.lastMessage = chat.messages[0];
  }
  return chatResult;
});
return Promise.all(promises);
}

export const getUserConversations = async userId => {
    const result = await getUserChatsWithLastMessage(userId);
    const answer = await getChatsWithUserNames(result);
    answer.forEach((chat)=>{
      chat.lastMessage['message'] = chat.lastMessage['text'];
      chat.lastMessage['sent'] = chat.lastMessage['sendTime'];
      chat.lastMessage['fromUserId'] = chat.lastMessage['senderId'];
      chat.lastMessage['language'] = chat.lastMessage['originalLanguageName'];
      ['chatId', 'text', 'sendTime', 'senderId', 'originalLanguageName'].forEach(e => delete chat.lastMessage[e]);
    });
  
    return { ok: true, conversations: answer};
  };


  