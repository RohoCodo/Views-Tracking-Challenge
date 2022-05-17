import * as functions from "firebase-functions";
import { addRecordingViews, addUserViews, checkUniqueness } from "./addedFunctions";
import {db} from "./index";

/* BONUS OPPORTUNITY
It's not great (it's bad) to throw all of this code in one file.
Can you help us organize this code better?
*/

// export async function retrieveViewCount(vidId:)

export async function trackRecordingView(viewerId: string, recordingId: string): Promise<void> {
  // TODO: implement this function
  const viewerSnapshot = await db.collection("Users").doc(viewerId).get();

  if(!viewerSnapshot.exists){
    functions.logger.debug("User does not exist");
    return;
  }
  

  const recordingSnap = await db.collection("Recordings").doc(recordingId).get();

  if(!recordingSnap.exists){
    functions.logger.debug("Recording does not exist: ", recordingId);
    return;
  }
  else{
    const recData = recordingSnap.data();
    if(recData !== undefined){
      const creator = await db.collection("Users").doc(recData.creatorId);
      const creatorSnap = creator.get();
      if(creatorSnap.exists){
        functions.logger.debug("Creator does not exist: ",recData.creatorId );
        return;
      }
      const unique = checkUniqueness(viewerId, recordingId);

      if(!unique){
        return;
      }
      else{
        const recRef = await db.collection("Recordings").doc(recordingId);

        await db.runTransaction(async (t): Promise<void>  => {
          // const recDoc = await t.get(recording)
          const recordingDoc = await t.get(recRef);
          const recData = await recordingDoc.data();
          const userDoc = await t.get(creator);
          const userData = await userDoc.data();
          if(recData !== undefined){
            addRecordingViews(viewerId, recordingId);
          }
          if(userData !== undefined){
            addUserViews(viewerId, recordingId);
          }

        });
      }


    }
  }
  // let viewCountRn = db.collection("Recording").where("id", "==", recordingId).get().data()["uniqueViewCount"];
  // // 
  // db.collection("Recording")
  // .where("id", "==", recordingId)
  // .update({uniqueViewCount: viewCountRn + 1});

  // let userViewCount = db.collection("User").where("id", "==", viewerId).get().data()["uniqueRecordingViewCount"];

  // db.collection("User")
  // .where("id", "==", viewerId)
  // .update({uniqueRecordingViewCount: userViewCount + 1});
  
  // // logs can be viewed in the firebase emulator ui
  // functions.logger.debug("viewerId: ", viewerId);
  // functions.logger.debug("recordingId: ", recordingId);


  // ATTN: the rest of the code in this file is only here to show how firebase works

  // read from a document
  // const documentSnapshot = await db.collection("collection").doc("doc").get();
  // if (documentSnapshot.exists) {
  //   const data = documentSnapshot.data();
  //   functions.logger.debug("it did exist!", data);
  // } else {
  //   functions.logger.debug("it didn't exist");
  // }

  // overwrite a document based on the data you have when sending the write request
  // set overwrites all existing fields and creates new documents if necessary
  // await db.collection("collection").doc("doc").set({id: "id", field: "foo"});
  // update will fail if the document exists and will only update fields included
  // in your update
  // await db.collection("collection").doc("doc").update({id: "id", field: "bar"});

  // update based on data inside the document at the time of the write using a transaction
  // https://firebase.google.com/docs/firestore/manage-data/transactions#web-version-9

  // await db.runTransaction(async (t): Promise<void> => {
  //   const ref = db.collection("collection").doc("doc");
  //   const docSnapshot = await t.get(ref);
  //   // do something with the data
  //   t.set(ref, {id: "id", field: "foobar"});
  // });
}
