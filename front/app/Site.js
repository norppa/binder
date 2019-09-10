import React from 'react'
import Modal from 'react-modal'
import axios from 'axios'
import './Site.css'

import Brancher from './Brancher'

const api = 'http://localhost:3000/api'

Modal.setAppElement('#app')

class Site extends React.Component {
    state = {
        auth: undefined,
        modal: false,
        incorrectPasswordMessage: false,
        passwordValue: '',
        data: undefined,
        selected: [0]
    }

    async componentDidMount() {
        console.log('cdm', this.state)
        const site = this.props.match.params.site
        const siteExists = await this.siteExists(site)
        const token = window.sessionStorage.getItem
        if (siteExists === undefined) {
            this.setState({ modal: 'error' })
        } else if (siteExists) {
            const token = window.sessionStorage.getItem(`${site}_token`)
            if (token) {
                console.log('token found', this.state.selected)
                this.setState({ auth: token }, this.getFiles)
            } else {
                this.setState({ modal: 'login' })
            }
        } else {
            this.setState({ modal: 'create' })
        }
        console.log('cdm done', this.state.selected)

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
        console.log('getFiles')
        const url = api + '/' + this.props.match.params.site + '/files'
        const headers = { headers: { Authorization: 'bearer ' + this.state.auth }}

        let fileList = await fetch(url, headers).then(response => response.json())
        console.log('fileList', fileList)

        const getChildrenOf = (parentId) => {
            const children = fileList.filter(x => x.parent === parentId)
            fileList = fileList.filter(x => x.parent !== parentId)
            children.forEach(node => {
                if (node.isFolder) {
                    node.children = getChildrenOf(node.id)
                }
            })
            return children
        }

        const data = getChildrenOf(null)

        this.setState({ data, selected: undefined })

    }

    siteExists = (site) => axios.get(`${api}/${site}`)
            .then(response => response.data)
            .catch(error => console.error(error))

    Modals = () => (
        <div className="Modals">
            <Modal isOpen={this.state.modal === 'login'}
                contentLabel={`Please log in to ${this.props.match.params.site}`}>
                {this.state.incorrectPasswordMessage ? <div>Incorrect Password!</div> : null}
                <h2>Log in to /{this.props.match.params.site}</h2>
                <form onSubmit={this.login}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

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

    onClickDelete = async (event) => {
        console.log('onClickDelete')

    }

    onClickNewFile = async (event) => {
        console.log('onClickNewFile')
    }

    createFile = async (event) => {

    }

    updateCurrentFile = (name) => (event) => {
        const data = [...this.state.data]
        const selectedFile = this.getFromData(this.state.selected, data)
        selectedFile[name] = event.target.value
        selectedFile.modified = true
        this.setState({ data })
    }

    brancherSetData = (data) => this.setState({ data })

    select = async ({ selected }) => {
        if (selected.isFolder) return

        const path = this.findPath(selected.id)
        console.log('select', selected, path)

        if (!selected.contents) {
            const url = api + '/' + this.props.match.params.site + '/files/' + selected.id
            const headers = {
                method: 'GET',
                headers: { Authorization: 'bearer ' + this.state.auth }
            }
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 200) {
                const body = await fetchResult.json()
                const data = [ ...this.state.data ]
                // console.log('safölkkas', path, data)
                const file = this.getFromData(path, data)
                // console.log('file', file)
                file.contents = body.contents
                // console.log('data', data)
                this.setState({ data })
            }
        }
        this.setState({ selected: path })
    }

    saveChanges = async () => {
        const flattenData = (data) => {
            let result = []
            for (let i = 0; i < data.length; i++) {
                result = result.concat(data[i])
                if (data[i].isFolder) {
                    result = result.concat(flattenData(data[i].children))
                }
            }
            return result
        }

        const modifiedData = flattenData(this.state.data).filter(x => x.modified)
        console.log('flatData', modifiedData)
        if (modifiedData.length === 0) return

        const url = api + '/' + this.props.match.params.site
        const data = {
            method: 'PUT',
            headers: {
                'Authorization': 'bearer ' + this.state.auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modifiedData),

        }
        const fetchResult = await fetch(url,data)
        if (fetchResult.status === 201) {
            const localFileData = { ...this.state.localFileData }
            Object.keys(localFileData).forEach(key => localFileData[key].modified = false)
            this.setState({ localFileData })
        } else {
            console.log('failure', fetchResult.status)
        }
    }

    findPath = (id) => {
        const recursion = (folder, id) => {
            for (let i = 0; i < folder.length; i++) {
                if (folder[i].id === id) {
                    return [i]
                }
                if (folder[i].isFolder) {
                    const searchResult = recursion(folder[i].children, id)
                    if (searchResult) {
                        return searchResult.concat(i)
                    }
                }
            }
            return undefined
        }
        return recursion(this.state.data, id)
    }

    getFromData = (path, data) => {
        if (path === undefined) return { name: '', contents: '', disabled: true }

        let result = { children: data }
        for (let i = path.length - 1; i >= 0; i--) {
            result = result.children[path[i]]
        }
        return result
    }



    render () {
        if (this.state.data === undefined) return <div />
        // colors #425270 60ADD0 92ADC4 D8E6F3 57394D
        const selectedFile = this.getFromData(this.state.selected, this.state.data)
        return (
            <div className="Site">
                <div className="navi">
                    <div className="navi-btns">
                        <button onClick={this.saveChanges}>save</button>
                    </div>

                    <Brancher data={this.state.data}
                        setData={this.brancherSetData}
                        onSelect={this.select} />

                    <div className="debug-info">
                        {this.state.debug}
                    </div>
                </div>
                <div>
                <input type="text" value={selectedFile.name}
                    onChange={this.updateCurrentFile('name')}
                    disabled={selectedFile.disabled} />
                <textarea value={selectedFile.contents}
                    onChange={this.updateCurrentFile('contents')}
                    disabled={selectedFile.disabled} />
                </div>

                <this.Modals />
            </div>

        )
    }
}

export default Site;
