import React from 'react'
import Modal from 'react-modal'
import axios from 'axios'
import './Site.css'

import Brancher from './Brancher'

const api = 'http://localhost:3000/api'

const Empty = () => null
const Create = () => <div>create</div>
const Authorized = () => <div>authorized</div>
Modal.setAppElement('#app')

class Site extends React.Component {
    state = {
        auth: undefined,
        name: this.props.match.params.site,
        modal: false,
        incorrectPasswordMessage: false,
        passwordValue: '',
        fileStructure: [],
        currentFile: {},
        currentFolderId: null,
        brancherData:  []
    }

    async componentDidMount() {
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
            this.setState({ modal: 'create' })
        }

    }

    handlePasswordValueChange = (event) => this.setState({ passwordValue: event.target.value })
    openModal = (type) => () => this.setState({ modal: type })
    closeModal = () => this.setState({ modal: false, incorrectPasswordMessage: false })
    login = (event) => {
        event.preventDefault()
        axios.post(`${api}/${this.props.match.params.site}/login`, { password: this.state.passwordValue })
            .then(response => {
                if (response.status === 200) {
                    window.sessionStorage.setItem(this.props.match.params.site + '_token', response.data.token)
                    this.setState({ auth: response.data.token }, this.getFiles)
                    this.closeModal()
                }
            })
            .catch(error => {
                if (error.response.status === 401) {
                    this.setState({ incorrectPasswordMessage: true })
                }
            })
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

        const toTreeNode = (listItem) => {
            const treeNode = {
                id: listItem.id,
                name: listItem.name
            }
            if (listItem.isFolder) {
                treeNode.children = true
            }
            return treeNode
        }

        const getChildrenOf = (parentId) => {
            const children = fileList.filter(x => x.parent === parentId).map(toTreeNode)
            fileList = fileList.filter(x => x.parent !== parentId)
            children.forEach(node => {
                if (node.children) {
                    node.children = getChildrenOf(node.id)
                }
            })
            return children
        }

        const tree = getChildrenOf(null)
        console.log('tree', tree)
        this.setState({ brancherData: tree })

    }

    siteExists = (site) => axios.get(`${api}/${site}`)
            .then(response => response.data)
            .catch(error => console.error(error))

    Modals = () => (
        <div className="Modals">
            <Modal isOpen={this.state.modal === 'login'}
                contentLabel={`Please log in to ${this.state.name}`}>
                {this.state.incorrectPasswordMessage ? <div>Incorrect Password!</div> : null}
                <h2>Log in to /{this.state.name}</h2>
                <form onSubmit={this.login}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

            <Modal isOpen={this.state.modal === 'create'}>
                <h2>Create /{this.state.name}</h2>
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

    onClickDelete = async (event) => {
        const url = api + '/' + this.props.match.params.site + '/files/' + this.state.currentFile.id
        const headers = {
            method: 'DELETE',
            headers: { Authorization: 'bearer ' + this.state.auth }
        }

        const fetchResult = await fetch(url, headers)
        if (fetchResult.status === 204) {
            const treeviewApi = this.treeview.current.api
            treeviewApi.removeItem(this.state.currentFile.id)
        }

    }

    onClickNewFile = async (event) => {
        console.log('onClickNewFile', this.state.currentFolderId)
        const url = api + '/' + this.props.match.params.site + '/files'
        const headers = {
            method: 'POST',
            body: JSON.stringify({
                name: 'new_file_1',
                contents: '',
                isFolder: false,
                parent: this.state.currentFolderId
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'bearer ' + this.state.auth
            }
        }
        const fetchResult = await fetch(url, headers)
        if (fetchResult.status === 200) {
            const body = await fetchResult.json()
            const createdId = body.id

            const treeviewApi = this.treeview.current.api
            console.log('XXX', this.state.currentFolderId)
            console.log(treeviewApi.getItems())
            const parentNode = this.state.currentFolderId
                ? treeviewApi.findFolder(this.state.currentFolderId)
                : treeviewApi.getRootItem()
            treeviewApi.addItem('new_file_1', true, parentNode)
            this.setState
        }
    }

    handleChange = (event) => this.setState({ contents: event.target.value })

    brancherSetData = (brancherData) => this.setState({ brancherData })
    brancherOnSelect = async ({ selected, parent }) => {
        if (!selected.children) {
            const url = api + '/' + this.props.match.params.site + '/files/' + selected.id
            const headers = {
                method: 'GET',
                headers: { Authorization: 'bearer ' + this.state.auth }
            }
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 200) {
                const body = await fetchResult.json()
                console.log('body', body)

                const currentFile = {
                    id: selected.id,
                    name: body.name,
                    contents: body.contents
                }
                const currentFolder = body.parent
                this.setState({ currentFile, currentFolder })
            }

        }
    }

    render () {
        console.log('rendering Site', this.state.brancherData)
        // colors #425270 60ADD0 92ADC4 D8E6F3 57394D
        return (
            <div className="Site">
                <div className="navi">
                    <div className="navi-btns">
                        <button onClick={this.onClickNewFile}>new file</button>
                        <button>new folder</button>
                        <button onClick={this.onClickDelete}>delete</button>
                    </div>
                    <Brancher data={this.state.brancherData}
                        setData={this.brancherSetData}
                        onSelect={this.brancherOnSelect} />
                    <div className="debug-info">
                        {this.state.debug}
                    </div>
                </div>


                <textarea value={this.state.currentFile.contents}
                    onChange={this.handleChange}/>

                <this.Modals />
            </div>

        )
    }
}

export default Site;
