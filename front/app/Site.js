import React from 'react'
import { Redirect } from 'react-router-dom'
import Modal from 'react-modal'
import Modals from './Modals'
import Brancher from './Brancher'
import './Site.css'

const api = 'http://localhost:3000/api'

Modal.setAppElement('#app')


class Site extends React.Component {
    state = {
        auth: undefined,
        modal: false,
        modalMsg: '',
        incorrectPasswordMessage: false,
        passwordValue: '',
        data: undefined
    }

    async componentDidMount() {
        console.log('componentDidMount')
        const site = this.props.match.params.site
        const siteExists = await this.siteExists(site)
        const token = window.sessionStorage.getItem
        if (siteExists === undefined) {
            this.setState({ modal: 'error' })
        } else if (siteExists) {
            const token = window.sessionStorage.getItem(`${site}_token`)
            if (token) {
                this.setState({ auth: token }, this.getFiles)
            } else {
                this.setState({ modal: 'login' })
            }
        } else {
            console.log('create-site')
            this.setState({ modal: 'create-site' })
        }
    }

    handlePasswordValueChange = (event) => this.setState({ passwordValue: event.target.value })
    openModal = (type) => () => this.setState({ modal: type })
    closeModal = () => this.setState({ modal: false, incorrectPasswordMessage: false })

    logout = () => {
        window.sessionStorage.removeItem(this.props.match.params.site + '_token')
        this.setState({ auth: undefined, data: 'redirect-logout', modal: false })
    }

    create = (event) => {
        event.preventDefault()
        console.log('create site', this.props.match.params.site )
        this.closeModal()
    }

    getFiles = async () => {
        const url = api + '/' + this.props.match.params.site + '/files'
        const headers = { headers: { Authorization: 'bearer ' + this.state.auth }}
        let fileList = await fetch(url, headers).then(response => response.json())
        this.setState({ data: fileList, openFilePath: undefined })

    }

    siteExists = async () => {
        const url = api + '/' + this.props.match.params.site
        console.log('url', url)
        const fetchResult = await fetch(url)
        if (fetchResult.status !== 200) {
            return console.error('siteExists failed', fetchResult)
        }
        return await fetchResult.json()
    }

    saveSite = async () => {
        console.log('saveSite')
        const modified = this.state.data.filter(file => file.modified || file.created || file.removed)
        console.log('modified', modified)
        if (modified.length === 0) {
            return
        }

        const url = api + '/' + this.props.match.params.site
        const headers = {
            method: 'PUT',
            headers: {
                'Authorization': 'bearer ' + this.state.auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modified)
        }
        console.log(url, headers)
        const fetchResult = await fetch(url, headers)
        console.log(fetchResult.status)
    }

    updateActive = (event) => {
        const data = this.state.data.map(file => {
            if (file.active) {
                return { ...file, contents: event.target.value, modified: true }
            } else {
                return file
            }
        })
        this.setState({ data })
    }

    select = async (selected) => {
        console.log('select', selected)
        const file = this.state.data.find(file => file.id === selected)
        if (file.isFolder) return

        if (file.contents === undefined) {
            const url = api + '/' + this.props.match.params.site + '/files/' + selected
            const headers = {
                method: 'GET',
                headers: { Authorization: 'bearer ' + this.state.auth }
            }
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 200) {
                const result = await fetchResult.json()
                const data = this.state.data.map(file => file.id === selected ? Object.assign({}, file, result, { active: true }) : file)
                this.setState({ data })
            }
        }
    }

    deselect = (event) => {
        if (event.target.className === 'navi' || event.target.className === 'navi-btns') {
            const data = this.state.data.map(file => {
                if (file.isFolder) {
                    return { ...file, selecte: false }
                } else {
                    return { ...file, selected: false, active: false }
                }
            })
            this.setState({ data })
        }
    }

    Modals = () => (
        <div className="Modals">
            <Modal isOpen={this.state.modal === 'create'}>
                <h2>Create /{this.props.match.params.site}</h2>
                <form onSubmit={this.create}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

            <Modal isOpen={this.state.modal === 'error'}>
                <h2>There was an error!</h2>
            </Modal>
        </div>
    )

    modalControls = {
        closeModal: () => {
            this.setState({ modal: false, modalMsg: '' })
        },
        changePassword: async (newPassword) => {
            console.log('changing password to ', newPassword)
            const url = api + '/' + this.props.match.params.site + '/password'
            const headers = {
                method: 'PUT',
                headers: {
                    'Authorization': 'bearer ' + this.state.auth,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPassword })
            }
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 201) {
                this.closeModal()
            } else {
                this.setState({ modalMsg: 'Password update failed'})
            }
        },
        deleteSite: async () => {
            const url = api + '/' + this.props.match.params.site
            const headers = {
                method: 'DELETE',
                headers: {
                    'Authorization': 'bearer ' + this.state.auth
                }
            }
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 201) {
                this.logout()
            } else {
                this.setState({ modalMsg: 'Failed to delete ' + this.props.match.params.site })
            }
        },
        login: async (password) => {
            const url = api + '/' + this.props.match.params.site + '/login'
            const headers = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            }
            console.log(url, headers)
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 200) {
                const result = await fetchResult.json()
                window.sessionStorage.setItem(this.props.match.params.site + '_token', result.token)
                this.setState({ auth: result.token }, this.getFiles)
                this.modalControls.closeModal()
            } else if (fetchResult.status === 401) {
                this.setState({ modalMsg: 'incorrect password' })
            } else {
                console.error('something went wrong', fetchResult)
            }
                // .then(response => {
                //     if (response.status === 200) {
                //         return response.json()
                //     }
                //     if (response.status === 401) {
                //         this.setState({ incorrectPasswordMessage: true })
                //         throw new Error('incorrect password')
                //     } else {
                //         console.error('something went wrong', response)
                //         throw new Error('something went wrong')
                //     }
                // })
                // .then(response => {
                //     window.sessionStorage.setItem(this.props.match.params.site + '_token', response.token)
                //     this.setState({ auth: response.token }, this.getFiles)
                //     this.closeModal()
                // })
                // .catch(error => null)
        }
    }

    render () {
        console.log('render', this.state.data)
        if (this.state.data === undefined) return <Modals open={this.state.modal}
            site={this.props.match.params.site}
            controls={this.modalControls}
            msg={this.state.modalMsg}/>
        if (this.state.data === 'redirect-logout') return <Redirect to='/binder' />
        // colors #425270 60ADD0 92ADC4 D8E6F3 57394D
        const activeFile = this.state.data.find(file => file.active) || { name: '', contents: '', disabled: true}
        return (
            <div className="Site">
                <div className="site-control-container">
                    <button onClick={this.saveSite}>save</button>
                    <button onClick={this.openModal('changePassword')}>change password</button>
                    <button onClick={this.logout}>log out</button>
                    <button onClick={this.openModal('confirm-delete')}>delete</button>
                </div>
                <div className="brancher-container" onClick={this.deselect}>
                    <Brancher data={this.state.data}
                        setData={(data) => this.setState({ data })}
                        onSelect={this.select} />
                </div>
                <div>

                    <div className="textarea-container">
                        <textarea value={activeFile.contents}
                            onChange={this.updateActive}
                            disabled={activeFile.disabled} />
                        </div>
                    </div>


                <this.Modals />
                <Modals open={this.state.modal}
                    site={this.props.match.params.site}
                    controls={this.modalControls}
                    msg={this.state.modalMsg}/>
            </div>

        )
    }
}

export default Site;
