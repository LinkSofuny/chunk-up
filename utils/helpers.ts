export const noop = () => {}

export const isFunc = (v : any) => typeof v === 'function'

export const isExist = (v: any) => v !== null || v !== undefined

export const getType = (v: any) => Object.prototype.toString.call(v).split(/\s|\]/g)[1].toLocaleLowerCase()