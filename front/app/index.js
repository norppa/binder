import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route } from 'react-router-dom'

function Router() {
  return (
    <BrowserRouter>
        <Switch>
            <Route path="/" exact component={Foo} />
            <Route path="/:site" component={Bar} />
        </Switch>
    </BrowserRouter>
  );
}

const Foo = () => (<div>foo</div>)
const Bar = ({ match }) => (<div>site: {match.params.site}</div>)

ReactDOM.render(<Router />, document.getElementById('app'))
