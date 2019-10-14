import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom'

import Frontpage from './Frontpage'
import Site from './Site'

function Router() {
  return (
    <BrowserRouter>
        <Switch>
            <Route path="/binder" exact component={Frontpage} />
            <Route path="/binder/:site" component={Site} />
        </Switch>
    </BrowserRouter>
  );
}



ReactDOM.render(<Router />, document.getElementById('app'))
