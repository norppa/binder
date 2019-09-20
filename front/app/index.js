import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom'

import Site from './Site'

function Router() {
  return (
    <BrowserRouter>
        <Switch>
            <Route path="/binder" exact component={Foo} />
            <Route path="/binder/:site" component={Site} />
        </Switch>
    </BrowserRouter>
  );
}

const Foo = () => (<div><Link to="/binder/foo">/binder/foo</Link></div>)

ReactDOM.render(<Router />, document.getElementById('app'))
