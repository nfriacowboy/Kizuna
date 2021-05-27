import React, { useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonLoading,
} from "@ionic/react";
import { useIntl } from "react-intl";
import { useSelector } from "react-redux";

// Redux
import {
  FilePayload,
  isTextPayload,
  Payload,
} from "../../../../../redux/commons/types";
import { getNextBatchGroupMessages } from "../../../../../redux/group/actions/getNextBatchGroupMessages";
import {
  GroupMessageBatchFetchFilter,
  GroupMessagesOutput,
  GroupMessage,
} from "../../../../../redux/group/types";
import { RootState } from "../../../../../redux/types";

// Components
import FileIndex from "./FileIndex";
import EmptyFile from "./EmptyFile";

import { monthToString, useAppDispatch } from "../../../../../utils/helpers";
import styles from "./style.module.css";
import { deserializeHash } from "@holochain-open-dev/core-types";

interface Props {
  groupId: string;
}

const File: React.FC<Props> = ({ groupId }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const infiniteFileScroll = useRef<HTMLIonInfiniteScrollElement>(null);
  const complete = () => infiniteFileScroll.current!.complete();

  const [loading, setLoading] = useState<boolean>(true);
  const [oldestFetched, setOldestFetched] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [indexedFileMessages, setIndexedFileMessages] = useState<{
    [key: string]: GroupMessage[];
  }>({});
  const [fileMessages, setFileMessages] = useState<GroupMessage[]>([]);

  // USE SELECTORS
  const groupFileMessages: GroupMessage[] = useSelector((state: RootState) => {
    // eslint-disable-next-line array-callback-return
    let groupMessages = state.groups.conversations[groupId].messages
      .map((key: string) => {
        let messageContent: GroupMessage = state.groups.messages[key];
        let payload: FilePayload | null = isTextPayload(messageContent.payload)
          ? null
          : messageContent.payload.fileType === "OTHER"
          ? messageContent.payload
          : null;
        if (payload) {
          return messageContent;
        }
      })
      .flatMap((x: GroupMessage | undefined) => (x ? [x] : []));
    return groupMessages;
  });

  const indexMedia: (fileMessages: GroupMessage[]) => {
    [key: string]: GroupMessage[];
  } = (fileMessages) => {
    let filteredMessages = fileMessages.filter((message) => {
      const payload: Payload = message.payload;
      return !isTextPayload(payload) && payload.fileType === "OTHER";
    });
    let indexedFiles: {
      [key: string]: GroupMessage[];
    } = indexedFileMessages;
    if (filteredMessages.length > 0) {
      let monthNumber = new Date(
        fileMessages[0].timestamp[0] * 1000
      ).getMonth();
      let month = monthToString(monthNumber, intl)!;
      if (!indexedFiles[month]) {
        indexedFiles[month] = [];
      }
      fileMessages.forEach((fileMessage: GroupMessage) => {
        const currMonth = monthToString(
          new Date(fileMessage.timestamp[0] * 1000).getMonth(),
          intl
        );
        if (currMonth !== month) {
          month = currMonth!;
          indexedFiles[month] = [];
        }
        const currArr = indexedFiles[currMonth!];
        const payload: Payload = fileMessage.payload;
        if (!isTextPayload(payload) && payload.fileType === "OTHER") {
          currArr.push(fileMessage);
        }
      });
    }
    Object.keys(indexedFiles).forEach((month: string) => {
      let uniqueMessages: GroupMessage[] = [...new Set(indexedFiles[month])];
      indexedFiles[month] = uniqueMessages;
    });
    return indexedFiles;
  };

  const onScrollBottom = (
    complete: () => Promise<void>,
    files: GroupMessage[]
  ) => {
    setFetchLoading(true);
    // var lastFile: P2PMessage = Object.values(files)[Object.entries(files).length - 1];
    var lastFile: GroupMessage = files[files.length - 1];
    dispatch(
      getNextBatchGroupMessages({
        groupId: deserializeHash(groupId),
        batchSize: 4,
        payloadType: { type: "FILE", payload: null },
        lastMessageTimestamp:
          lastFile !== undefined ? lastFile.timestamp : undefined,
        lastFetched:
          lastFile !== undefined
            ? deserializeHash(lastFile.groupMessageEntryHash)
            : undefined,
      })
    ).then((res: GroupMessagesOutput) => {
      if (Object.keys(res.groupMessagesContents).length !== 0) {
        let newFiles = Object.keys(res.groupMessagesContents).map(
          (key: string) => {
            let message: GroupMessage = res.groupMessagesContents[key];
            return message;
          }
        );
        setFileMessages([...fileMessages, ...newFiles]);
        const indexedMedia: {
          [key: string]: GroupMessage[];
        } = indexMedia(newFiles);
        setIndexedFileMessages(indexedMedia);
        setFetchLoading(false);
      } else {
        setOldestFetched(true);
        setFetchLoading(false);
      }
    });
    complete();
    return;
  };

  useEffect(() => {
    if (groupFileMessages.length >= 10) {
      setFileMessages([...fileMessages, ...groupFileMessages]);
      const indexedMedia: {
        [key: string]: GroupMessage[];
      } = indexMedia(groupFileMessages);
      setIndexedFileMessages(indexedMedia);
      setLoading(false);
    } else {
      let filter: GroupMessageBatchFetchFilter = {
        groupId: deserializeHash(groupId),
        batchSize: 20,
        payloadType: { type: "FILE", payload: null },
      };
      dispatch(getNextBatchGroupMessages(filter)).then(
        (res: GroupMessagesOutput) => {
          let maybeFileMessages: (GroupMessage | undefined)[] = Object.keys(
            res.groupMessagesContents
          ).map((key: any) => {
            if (!isTextPayload(res.groupMessagesContents[key].payload)) {
              let message = res.groupMessagesContents[key];
              return message;
            } else {
              return undefined;
            }
          });

          let fileMessagesCleaned = maybeFileMessages.flatMap(
            (x: GroupMessage | undefined) => (x ? [x] : [])
          );
          setFileMessages([...fileMessages, ...fileMessagesCleaned]);

          const indexedMedia: {
            [key: string]: GroupMessage[];
          } = indexMedia(fileMessagesCleaned);
          setIndexedFileMessages(indexedMedia);
          setLoading(false);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return !loading ? (
    Object.keys(indexedFileMessages).length !== 0 ? (
      <IonContent>
        <IonList className={styles.filelist}>
          {Object.keys(indexedFileMessages).map((month: string) => {
            const fileMessages = indexedFileMessages[month];
            let files: FilePayload[] = [];
            fileMessages.forEach((fileMessage: GroupMessage) => {
              if (!isTextPayload(fileMessage.payload)) {
                files.push(fileMessage.payload);
              }
            });

            return (
              <FileIndex
                onCompletion={() => {
                  return true;
                }}
                key={month}
                index={month}
                fileMessages={fileMessages}
                files={files}
              />
            );
          })}
          <IonInfiniteScroll
            disabled={oldestFetched ? true : false}
            threshold="10px"
            ref={infiniteFileScroll}
            position="bottom"
            onIonInfinite={(e) => onScrollBottom(complete, fileMessages)}
          >
            <IonInfiniteScrollContent>
              <IonLoading
                isOpen={fetchLoading}
                message={intl.formatMessage({
                  id: "app.group-chat.files.fetching",
                })}
              />
            </IonInfiniteScrollContent>
          </IonInfiniteScroll>
        </IonList>
      </IonContent>
    ) : (
      <EmptyFile />
    )
  ) : (
    <IonLoading isOpen={loading} />
  );
};

export default File;