import { deserializeHash, serializeHash } from "@holochain-open-dev/core-types";
import { FUNCTIONS, ZOMES } from "../../../connection/types";
import { ThunkAction } from "../../types";
import {
  GroupConversation,
  GroupMessageBatchFetchFilter,
  GroupMessagesOutput,
  SetLatestGroupVersionAction,
  SET_LATEST_GROUP_VERSION,
} from "../types";
import {
  convertFetchedResToGroupMessagesOutput,
  fetchUsernameOfMembers,
} from "./helpers";

export const getLatestGroupVersion =
  (groupId: string): ThunkAction =>
  async (dispatch, getState, { callZome, getAgentId }) => {
    const myAgentId = await getAgentId();
    const latestGroupVersionRes = await callZome({
      zomeName: ZOMES.GROUP,
      fnName: FUNCTIONS[ZOMES.GROUP].GET_GROUP_LATEST_VERSION,
      payload: {
        groupHash: deserializeHash(groupId),
      },
    });

    let groupMessageBatchFetchFilter: GroupMessageBatchFetchFilter = {
      groupId: deserializeHash(groupId),
      batchSize: 10,
      payloadType: {
        type: "ALL",
        payload: null,
      },
    };

    const groupMessagesRes = await callZome({
      zomeName: ZOMES.GROUP,
      fnName: FUNCTIONS[ZOMES.GROUP].GET_NEXT_BATCH_GROUP_MESSAGES,
      payload: groupMessageBatchFetchFilter,
    });

    let groupMessagesOutput: GroupMessagesOutput =
      convertFetchedResToGroupMessagesOutput(groupMessagesRes);

    let groupData: GroupConversation = {
      originalGroupEntryHash: serializeHash(latestGroupVersionRes.groupId),
      originalGroupHeaderHash: serializeHash(
        latestGroupVersionRes.groupRevisionId
      ),
      name: latestGroupVersionRes.latestName,
      members: latestGroupVersionRes.members.map((member: any) =>
        serializeHash(member)
      ),
      createdAt: latestGroupVersionRes.created,
      creator: serializeHash(latestGroupVersionRes.creator),
      messages:
        groupMessagesOutput.messagesByGroup[
          serializeHash(latestGroupVersionRes.groupId)
        ],
    };

    let membersUsernames = await fetchUsernameOfMembers(
      getState(),
      groupData.members,
      callZome,
      serializeHash(myAgentId!)
    );

    dispatch<SetLatestGroupVersionAction>({
      type: SET_LATEST_GROUP_VERSION,
      groupData,
      groupMessagesOutput,
      membersUsernames,
    });

    return groupData;
  };