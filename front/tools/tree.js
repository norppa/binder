const findPath = (id, node) => {
    if (node.id === id) return []

    if (node.isFolder) {
        for (let i=0; i< node.children.length; i++) {
            const path = findPath(id, node.children[i])
            if (path) return [i].concat(path)
        }
    }
}

const findSelected = (node) => {
    if (node.selected) return node
    if (node.isFolder) {
        for (let i = 0; i < node.children.length; i++) {
            const selected = findSelected(node.children[i])
            if (selected) return selected
        }
    }
}

const get = (path, node) => {
    if (path === undefined) return { name: '', contents: '', disabled: true }

    let result = node
    for (let i = 0; i < path.length; i++) {
        result = result.children[path[i]]
    }
    return result
}

const find = (id, node) => this.getFromData(this.findPath(id, node), node)

const flatten = (node) => {
    let result = [node]
    if (node.isFolder) {
        for (let i = 0; i < node.children.length; i++) {
            result = result.concat(flatten(node.children[i]))
        }
    }
    return result
}

module.exports = {
    find,
    get,
    findPath,
    findSelected,
    flatten
}
