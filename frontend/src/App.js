import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Layout } from "antd";

import { PrivateRoute, PublicRoute } from "./common/SpecialRoutes";

import "./App.css";
import StudentDashboard from "./views/StudentDashboard/StudentDashboard";
import Login from "./views/Login/Login";
import RegisterForm from "./views/RegisterForm/RegisterForm";
import NotFound from "./views/NotFound";
import ECellFooter from "./common/ECellFooter";
import { Provider } from "react-redux";
import store from "./redux/store";

const { Footer } = Layout;

function App() {

    return (
        <Layout className="App">
            <Router>
                <Layout>
                    <Provider store={store}>
                        <Switch>
                            <PublicRoute exact path="/login" component={Login} />
                            <PublicRoute exact path="/student-register" component={RegisterForm} />
                            <PrivateRoute
                                exact
                                path="/student-dashboard"
                                component={StudentDashboard}
                                redirectTo="/login"
                            />
                            <Route path="*" component={NotFound}/>
                        </Switch>
                    </Provider>
                </Layout>
            </Router>
            <Footer
                style={{
                    backgroundColor: "white",
                    boxShadow: "0px -1px 20px rgba(85, 85, 85, 0.2)",
                    padding: "20px",
                    marginTop: "1rem",
                    zIndex: 1002,
                }}>
                <ECellFooter
                    developers={[
                        {
                            name: "Abhijit",
                            whatsappNum: "+91 8895219514",
                            profileURL: "https://github.com/abhijit-hota",
                        },
                    ]}
                />
            </Footer>
        </Layout>
    );
}

export default App;
