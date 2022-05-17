import {Recording} from "./interfaces";
import {User} from "./interfaces";
import {db} from "./index";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Function to check uniqueness of this view - as in if this viewer has already viewed this

export async function checkUniqueness(viewerId: string, recordingId: string): Promise<Boolean> {
    const viewsRecordingUserSnapshot = await db.collection("Recordings").doc(recordingId).collection("UniqueIds").where('id', '==', viewerId).get()
      if (viewsRecordingUserSnapshot.empty) {
        // adding new viewer to recording's viewer subcollection
        await db.collection("Recordings").doc(recordingId).collection("UniqueIds").add({
          id: viewerId,
        });
        return true;
      }
      else {
        functions.logger.debug("Viewer has already seen this recording");
        return false;
      }
}

// Function to add view to recording 


export async function addRecordingViews(viewerId: string, recordingId: string): Promise<void> {
    const recordingRef = db.collection('Recordings').doc(recordingId);
    const recordingSnap = await recordingRef.get();
    if (recordingSnap.exists){
        // increment the view count.
        recordingRef.update({
            uniqueViewCount: admin.firestore.FieldValue.increment(1)
        });
        functions.logger.debug("Increment uniqueViewCount for recording: ", recordingId)
    } else {
        const recording: Recording = {
            // Creator must be the first viewer
            id: recordingId,
            creatorId: viewerId,
            uniqueViewCount:1
        };
        recordingRef.set(recording);
        functions.logger.debug("Add new document for recording: ", recordingId)
    }
    return;
}

// Function to check add view to user

export async function addUserViews(viewerId: string, recordingId: string): Promise<void> {
    const userRef = db.collection('Users').doc(viewerId);
    const userSnap = await userRef.get();
    if (userSnap.exists){
        // increment the view count.
        userRef.update({
            uniqueRecordingViewCount: admin.firestore.FieldValue.increment(1)
        });
        functions.logger.debug("Increment uniqueRecordingViewCount for user: ", viewerId)
    } else {
        const user: User = {
            id: viewerId,
            // This must be the creator then, so its the first view
            uniqueRecordingViewCount:1
        };
        userRef.set(user);
        functions.logger.debug("Add new document for recording: ", recordingId)
    }
    return;
}