import { supabase } from "../../config/supabaseClient";


// =====================================
// Get conversation messages
// =====================================

export async function getConversationMessages(conversationId) {

  const {
    data,
    error
  } = await supabase

    .from("messages")

    .select("*")

    .eq(
      "conversation_id",
      conversationId
    )

    .order(
      "created_at",
      {
        ascending:true
      }
    );


  if(error){

    console.error(
      "Fetch Messages Error:",
      error
    );

    return {
      data:[],
      error
    };

  }


  return {
    data:data || [],
    error:null
  };

}




// =====================================
// Send new message
// =====================================

export async function sendMessage(
  conversationId,
  senderId,
  text
){

  const {
    data,
    error
  } = await supabase

    .from("messages")

    .insert({

      conversation_id:
        conversationId,

      sender_id:
        senderId,

      message:
        text,

      seen:false

    })

    .select()

    .single();



  if(error){

    console.error(
      "Send Message Error:",
      error
    );


    throw error;

  }



  return {
    data,
    error:null
  };

}