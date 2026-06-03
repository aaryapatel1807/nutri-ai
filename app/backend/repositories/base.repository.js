class BaseRepository {
  constructor(model) {
    this.model = model
  }

  async create(data) {
    try {
      return await this.model.create({ data })
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Record already exists')
      }
      throw new Error('Database operation failed')
    }
  }

  async findById(id) {
    try {
      return await this.model.findUnique({ where: { id } })
    } catch (error) {
      throw new Error('Database operation failed')
    }
  }

  async findOne(where) {
    try {
      return await this.model.findFirst({ where })
    } catch (error) {
      throw new Error('Database operation failed')
    }
  }

  async findMany(where = {}, options = {}) {
    try {
      return await this.model.findMany({ where, ...options })
    } catch (error) {
      throw new Error('Database operation failed')
    }
  }

  async update(id, data) {
    try {
      return await this.model.update({ where: { id }, data })
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Record not found')
      }
      throw new Error('Database operation failed')
    }
  }

  async updateMany(where, data) {
    try {
      return await this.model.updateMany({ where, data })
    } catch (error) {
      throw new Error('Database operation failed')
    }
  }

  async delete(id) {
    try {
      return await this.model.delete({ where: { id } })
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Record not found')
      }
      throw new Error('Database operation failed')
    }
  }

  async deleteMany(where) {
    try {
      return await this.model.deleteMany({ where })
    } catch (error) {
      throw new Error('Database operation failed')
    }
  }

  async count(where = {}) {
    try {
      return await this.model.count({ where })
    } catch (error) {
      throw new Error('Database operation failed')
    }
  }
}

module.exports = BaseRepository
