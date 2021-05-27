import { serializeHash } from "@holochain-open-dev/core-types";
import { FUNCTIONS, ZOMES } from "../../../connection/types";
import { ThunkAction } from "../../types";
import { convertFetchedResToGroupMessagesOutput } from "./helpers";
import {
  GroupMessageBatchFetchFilter,
  GroupMessagesOutput,
  SetNextBatchGroupMessagesAction,
  SET_NEXT_BATCH_GROUP_MESSAGES,
} from "../types";

export const getNextBatchGroupMessages =
  (groupMessageBatchFetchFilter: GroupMessageBatchFetchFilter): ThunkAction =>
  async (dispatch, _getState, { callZome }): Promise<GroupMessagesOutput> => {
    // TODO: error handling
    // TODO: input sanitation
    const groupMessagesRes = await callZome({
      zomeName: ZOMES.GROUP,
      fnName: FUNCTIONS[ZOMES.GROUP].GET_NEXT_BATCH_GROUP_MESSAGES,
      payload: groupMessageBatchFetchFilter,
    });

    let groupMessagesOutput: GroupMessagesOutput =
      convertFetchedResToGroupMessagesOutput(groupMessagesRes);

    dispatch<SetNextBatchGroupMessagesAction>({
      type: SET_NEXT_BATCH_GROUP_MESSAGES,
      groupMessagesOutput,
      groupId: serializeHash(groupMessageBatchFetchFilter.groupId),
    });

    return groupMessagesOutput;
  };