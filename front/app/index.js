import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route } from 'react-router-dom'

import Site from './Site'

function Router() {
  return (
    <BrowserRouter>
        <Switch>
            <Route path="/" exact component={Foo} />
            <Route path="/:site" component={Site} />
        </Switch>
    </BrowserRouter>
  );
}

const Foo = () => (<div>foo</div>)

ReactDOM.render(<Router />, document.getElementById('app'))
