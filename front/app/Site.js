import React from 'react'
import Modal from 'react-modal'
import axios from 'axios'

import Login from './Login'

const api = 'http://localhost:3000/api'

const Empty = () => null
const Create = () => <div>create</div>
const Authorized = () => <div>authorized</div>
Modal.setAppElement('#app')


class Site extends React.Component {
    state = {
        auth: undefined,
        name: this.props.match.params.site,
        loginModalOpen: false,
        passwordValue: ''
    }

    openLoginModal = () => this.setState({ loginModalOpen: true })
    closeLoginModal = () => this.setState({ loginModalOpen: false })
    handlePasswordValueChange = (event) => this.setState({ passwordValue: event.target.value })
    login = (event) => {
        event.preventDefault()
        console.log('foo')
        this.closeLoginModal()
    }

    async componentDidMount() {
        console.log('trying')
        const site = this.props.match.params.site
        const localStorageKey = 'binder_' + site
        const token = window.localStorage.getItem(localStorageKey)
        if (token) {
            this.setState({ auth: token})
        } else {
            if(await this.siteExists(site)) {
                this.setState({ loginModalOpen: true })
            }
        }

    }

    siteExists = (site) => axios.get(`${api}/${site}`)
            .then(response => response.data)

    render () {
        return (
            <div className="Site">
                Site
                <Modal isOpen={this.state.loginModalOpen}
                    contentLabel={`Please log in to ${this.state.name}`}>
                    <h2>Enter password for /{this.state.name}</h2>
                    <form onSubmit={this.login}>
                        <input type="password"
                            value={this.state.passwordValue}
                            onChange={this.handlePasswordValueChange} />
                    </form>
                    <button onClick={this.closeLoginModal}>close</button>
                </Modal>
            </div>

        )
    }
}

export default Site;
