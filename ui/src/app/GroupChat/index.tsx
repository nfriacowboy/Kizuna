import { AgentPubKey } from "@holochain/conductor-api";
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router";
import {
  createGroup,
  addGroupMembers,
  removeGroupMembers,
  updateGroupName,
  sendGroupMessage,
  getNextBatchGroupMessages,
  getMessagesByGroupByTimestamp,
  getLatestGroupVersion,
} from "../../redux/group/actions";
import {
  GroupConversation,
  GroupMessageInput,
  UpdateGroupNameData,
  GroupMessage,
  UpdateGroupMembersData,
  GroupMessageBatchFetchFilter,
  GroupMessagesOutput,
  GroupMessageByDateFetchFilter
} from "../../redux/group/types";
import { RootState } from "../../redux/types";
import { FileMetadataInput, FilePayloadInput } from "../../redux/commons/types"; 
import MessageList from "./MessageList";
import { base64ToUint8Array, Uint8ArrayToBase64, useAppDispatch } from "../../utils/helpers";
import {fetchId} from "../../redux/profile/actions";

import MessageInput from "../../components/MessageInput";
import { arrowBackSharp } from "ionicons/icons";
import Chat from "../../components/Chat";

interface userData {
  id: string;
  username: string;
  isAdded: boolean;
}

interface GroupChatParams {
  group: string;
}

const GroupChat: React.FC = () => {
  const history = useHistory();
  const [myAgentId, setMyAgentId] = useState<string>("");
  const [files, setFiles] = useState<object[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupConversation | undefined>();
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState("");
  const dispatch = useAppDispatch();
  const { group } = useParams<GroupChatParams>();
  const groupData = useSelector(
    (state: RootState) => state.groups.conversations[group]
  );

  const handleOnSend = () => {
    let inputs: GroupMessageInput[] = [];
    if (files.length) {
      files.forEach((file: any) => {
        let filePayloadInput: FilePayloadInput = {
          type: "FILE",
          payload: {
            metadata: {
              fileName: file.metadata.fileName,
              fileSize:file.metadata.fileSize,
              fileType: file.metadata.fileType,
            },
            fileType: file.fileType,
            fileBytes: file.fileBytes,
          }
        }
        let groupMessage: GroupMessageInput = {
          groupHash: base64ToUint8Array(groupInfo!.originalGroupEntryHash),
          payloadInput: filePayloadInput,
          sender: Buffer.from(base64ToUint8Array(myAgentId).buffer),
          // TODO: handle replying to message here as well
          replyTo: undefined,
        };
        inputs.push(groupMessage);
      });
    };
    if (message.length) {
      inputs.push({
        groupHash: base64ToUint8Array(groupInfo!.originalGroupEntryHash),
        payloadInput: {
          type: "TEXT",
          payload: {payload: message}
        },
        sender: Buffer.from(base64ToUint8Array(myAgentId).buffer),
        // TODO: handle replying to message here as well
        replyTo: undefined,
      })
    }

    inputs.forEach((groupMessage: any) => {
      // TODO: error handling
      dispatch(sendGroupMessage(groupMessage)).then((res: GroupMessage) => {
        groupInfo?.messages.push(res.groupMessageEntryHash)
      });
    });
  };

  const handleOnBack = () => {
    history.push({
      pathname: `/home`,
    });
  };


  useEffect(() => {
  // setLoading(true);
  dispatch(fetchId()).then((res: AgentPubKey | null) => {
    if (res) setMyAgentId(Uint8ArrayToBase64(res))
  });
  }, [])

  useEffect(() => {
    if (groupData) {
      dispatch(getLatestGroupVersion(group)).then((res:GroupConversation) => {
        console.log(res);
        setGroupInfo(res);
      })
      setLoading(false);
    } else {
      dispatch(getLatestGroupVersion(group)).then((res:GroupConversation) => {
        console.log(res);
        setGroupInfo(res);
        setLoading(false);
      })
    }
  }, []);

  useEffect(() => {
    groupData ? groupData.messages ?  setMessages(groupData.messages) : setMessages([]) : setMessages([])
  }, [groupData])




  return (!loading && groupInfo) ? (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons>
            <IonButton  onClick={() => handleOnBack()} className="ion-no-padding" >
              <IonIcon slot="icon-only" icon={arrowBackSharp} />  
            </IonButton>
            <IonAvatar className="ion-padding">
              {/* TODO: proper picture for default avatar if none is set */}
              {groupInfo ? groupInfo!.avatar ? <img src={groupInfo!.avatar} alt={groupInfo!.name} /> : <img src={"https://upload.wikimedia.org/wikipedia/commons/8/8c/Lauren_Tsai_by_Gage_Skidmore.jpg"} alt={groupInfo!.name} /> : <img src={"https://upload.wikimedia.org/wikipedia/commons/8/8c/Lauren_Tsai_by_Gage_Skidmore.jpg"} alt={groupInfo!.name} />}
            </IonAvatar>
            <IonTitle className="ion-no-padding"> {groupInfo!.name}</IonTitle>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {groupData ? (
          <MessageList
            myAgentId={myAgentId}
            members={groupInfo!.members}
            messageIds={messages}
          ></MessageList>
        ) : <IonLoading isOpen={loading} />}
      </IonContent>
      {/* BUG: the input field does not reset to empty after send */}
      <MessageInput
          onSend={() => handleOnSend()}
          onChange={(message) => setMessage(message)}
          onFileSelect={(files) => setFiles(files)}
        />
    </IonPage>
  ) : <IonLoading isOpen={loading} />;
};

export default GroupChat;