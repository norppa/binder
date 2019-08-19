import React from 'react'
import axios from 'axios'

const api = 'http://localhost:3000/api'

const Empty = () => null
const Login = () => <div>login</div>
const Create = () => <div>create</div>
const Authorized = () => <div>authorized</div>


class Site extends React.Component {
    state = {
        auth: undefined,
        name: this.props.match.params.site,
        render: Empty
    }

    async componentDidMount() {
        const site = this.props.match.params.site
        const localStorageKey = 'binder_' + site
        const token = window.localStorage.getItem(localStorageKey)
        if (token) {
            this.setState({ auth: token, render: Authorized })
        } else {
            if(await this.siteExists(site)) {
                this.setState({render: Login})
            } else {
                this.setState({render: Create})
            }
        }

    }

    siteExists = (site) => axios.get(`${api}/exists/${site}`)
            .then(response => response.data)

    render () {
        return this.state.render()
    }
}

export default Site;
