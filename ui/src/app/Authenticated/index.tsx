import { IonRouterOutlet, IonSplitPane } from "@ionic/react";
import React, { useEffect } from "react";
import { Redirect, Route, Switch } from "react-router";
import Menu from "../../components/Menu";
import { fetchBlocked, fetchMyContacts } from "../../redux/contacts/actions";
import { fetchPreference } from "../../redux/preference/actions";
import { useAppDispatch } from "../../utils/helpers";
import Chat from "../Chat";
import NewConversation from "../NewConversation";
import Settings from "../Settings";
import Home from "../Home";
import Profile from "../Profile";
import Blocked from "../Blocked";
import GroupChat from "../GroupChat";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/types";

const Authenticated: React.FC = () => {
  const dispatch = useAppDispatch();
  useEffect(
    function () {
      dispatch(fetchPreference());
      dispatch(fetchMyContacts());
      dispatch(fetchBlocked());
    },
    [dispatch]
  );

  const store = useSelector((state: RootState) => state);

  return (
    <IonSplitPane contentId="main">
      <Menu />
      <IonRouterOutlet id="main">
        <Switch>
          <Route path="/home" render={() => <Home />} />
          <Route path="/compose" exact component={NewConversation} />
          <Route path="/u/:username" exact component={Chat} />
          <Route path="/settings" exact component={Settings} />
          <Route path="/g/:group" exact component={GroupChat} />
          <Route path="/p/:username" exact component={Profile} />
          <Route path="/test" exact component={GroupChat} />

          <Route path="/blocked" exact component={Blocked} />

          <Redirect from="/" to="/home" />
        </Switch>
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default Authenticated;