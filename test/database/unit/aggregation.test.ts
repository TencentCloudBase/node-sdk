import * as assert from 'power-assert'
import tcb from '../../../src/index'
import * as Config from '../../config.local'
import * as common from '../../common/index'

const app = tcb.init(Config)
const db = app.database()

const collName = 'db-test-aggregate'
const collection = db.collection(collName)

describe('sample', () => {
    it('sample', async () => {
        const data = [{ name: 'a' }, { name: 'b' }]
        const usersCollection = await common.safeCollection(db, 'test-users')

        const createSuccess = await usersCollection.create(data)
        assert.strictEqual(createSuccess, true)

        const result = await db
            .collection('test-users')
            .aggregate()
            .sample({
                size: 1
            })
            .end()
        assert.strictEqual(result.data.length, 1)

        usersCollection.remove()
    })
})

describe('sortByCount', () => {
    let passagesCollection = null
    const data = [
        { category: 'Web', tags: ['JavaScript', 'C#'] },
        { category: 'Web', tags: ['Go', 'C#'] },
        { category: 'Life', tags: ['Go', 'Python', 'JavaScript'] }
    ]

    beforeAll(async () => {
        passagesCollection = await common.safeCollection(db, 'test-sortByCount')
        const success = await passagesCollection.create(data)
        assert.strictEqual(success, true)
    })

    afterAll(async () => {
        const success = await passagesCollection.remove()
        assert.strictEqual(success, true)
    })

    it('统计基础类型', async () => {
        const result = await db
            .collection('test-sortByCount')
            .aggregate()
            .sortByCount('$category')
            .end()

        assert.strictEqual(result.data.length, 2)
    })

    it('解构数组类型', async () => {
        const result = await db
            .collection('test-sortByCount')
            .aggregate()
            .unwind('$tags')
            .sortByCount('$tags')
            .end()
        assert.strictEqual(result.data.length, 4)
    })
})

describe('match', () => {
    let coll = null
    const $ = db.command.aggregate
    const _ = db.command
    const data = [
        { author: 'stark', score: 80 },
        { author: 'stark', score: 85 },
        { author: 'bob', score: 60 },
        { author: 'li', score: 55 },
        { author: 'jimmy', score: 60 },
        { author: 'li', score: 94 },
        { author: 'justan', score: 95 }
    ]

    beforeAll(async () => {
        coll = await common.safeCollection(db, 'articles')
        const success = await coll.create(data)
        assert.strictEqual(success, true)
    })

    afterAll(async () => {
        const success = await coll.remove()
        assert.strictEqual(success, true)
    })

    it('匹配 字段 or 逻辑', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .match({
                author: _.or(_.eq('stark'), _.neq('stark'))
            })
            .end()

        assert(result.data.length === data.length)
    })

    it('匹配', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .match({
                author: 'stark'
            })
            .end()
        assert.strictEqual(result.data[0].author, 'stark')
    })

    it('计数', async () => {
        const { sum } = db.command.aggregate

        const { gt } = db.command
        const result = await db
            .collection('articles')
            .aggregate()
            .match({
                score: gt(80)
            })
            .group({
                _id: null,
                count: sum(1)
            })
            .end()
        assert.strictEqual(result.data[0].count, 3)
    })
})

describe('project', () => {
    let coll = null
    const data = [
        {
            title: 'This is title',
            author: 'Nobody',
            isbn: '123456789',
            introduction: '......'
        }
    ]

    beforeAll(async () => {
        coll = await common.safeCollection(db, 'articles')
        const success = await coll.create(data)
        assert.strictEqual(success, true)
    })

    afterAll(async () => {
        const success = await coll.remove()
        assert.strictEqual(success, true)
    })

    it('指定包含某些字段', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .project({
                title: 1,
                author: 1
            })
            .end()
        assert(result.data[0].author)
        assert(result.data[0].title)
        assert(!result.data[0].isbn)
    })

    it('去除输出中的 _id 字段', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .project({
                _id: 0,
                title: 1,
                author: 1
            })
            .end()
        assert.deepStrictEqual(result.data[0], {
            author: 'Nobody',
            title: 'This is title'
        })
    })

    it('加入计算出的新字段', async () => {
        const data = [
            {
                name: '小明',
                scores: {
                    chinese: 80,
                    math: 90,
                    english: 70
                }
            }
        ]
        const usersCollection = await common.safeCollection(db, 'test-users')

        const createSuccess = await usersCollection.create(data)
        assert.strictEqual(createSuccess, true)

        const { sum } = db.command.aggregate
        const result = await db
            .collection('test-users')
            .aggregate()
            .project({
                _id: 0,
                name: 1,
                totalScore: sum(['$scores.chinese', '$scores.math', '$scores.english'])
            })
            .end()
        assert.deepStrictEqual(result.data[0], {
            name: '小明',
            totalScore: 240
        })
        await usersCollection.remove()
    })

    it('加入新的数组字段', async () => {
        const data = [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 }
        ]
        const usersCollection = await common.safeCollection(db, 'test-users')

        const createSuccess = await usersCollection.create(data)
        assert.strictEqual(createSuccess, true)

        const result = await db
            .collection('test-users')
            .aggregate()
            .project({
                _id: 0,
                coordinate: ['$x', '$y']
            })
            .end()
        assert.deepStrictEqual(result.data[0], {
            coordinate: [1, 1]
        })
        await usersCollection.remove()
    })
})

describe('replaceRoot', () => {
    it('使用已有字段作为根节点', async () => {
        const data = [
            {
                name: 'SFLS',
                teachers: {
                    chinese: 22,
                    math: 18,
                    english: 21,
                    other: 123
                }
            }
        ]
        const usersCollection = await common.safeCollection(db, 'test-users')

        const createSuccess = await usersCollection.create(data)
        assert.strictEqual(createSuccess, true)

        const result = await db
            .collection('test-users')
            .aggregate()
            .replaceRoot({
                newRoot: '$teachers'
            })
            .end()
        assert.deepStrictEqual(result.data[0], {
            chinese: 22,
            math: 18,
            english: 21,
            other: 123
        })
        await usersCollection.remove()
    })
    it('使用计算出的新字段作为根节点', async () => {
        const data = [
            { first_name: '四郎', last_name: '黄' },
            { first_name: '邦德', last_name: '马' },
            { first_name: '牧之', last_name: '张' }
        ]
        const usersCollection = await common.safeCollection(db, 'test-users')

        const createSuccess = await usersCollection.create(data)
        assert.strictEqual(createSuccess, true)

        const { concat } = db.command.aggregate
        const result = await db
            .collection('test-users')
            .aggregate()
            .replaceRoot({
                newRoot: {
                    full_name: concat(['$last_name', '$first_name'])
                }
            })
            .end()
        assert.deepStrictEqual(result.data[0], {
            full_name: '黄四郎'
        })
        await usersCollection.remove()
    })
})

describe('skip', () => {
    let coll = null
    const data = [
        { author: 'stark', score: 80 },
        { author: 'stark', score: 85 },
        { author: 'bob', score: 60 },
        { author: 'li', score: 55 },
        { author: 'jimmy', score: 60 },
        { author: 'li', score: 94 },
        { author: 'justan', score: 95 }
    ]

    beforeAll(async () => {
        coll = await common.safeCollection(db, 'articles')
        const success = await coll.create(data)
        assert.strictEqual(success, true)
    })

    afterAll(async () => {
        const success = await coll.remove()
        assert.strictEqual(success, true)
    })

    it('跳过一定数量的文档', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .skip(6)
            .project({
                _id: 0
            })
            .end()
        assert.deepStrictEqual(result.data[0], { author: 'justan', score: 95 })
    })
})

describe('sort', () => {
    let coll = null
    const data = [
        { author: 'stark', score: 80, age: 18 },
        { author: 'bob', score: 60, age: 18 },
        { author: 'li', score: 55, age: 19 },
        { author: 'jimmy', score: 60, age: 22 },
        { author: 'justan', score: 95, age: 33 }
    ]

    beforeAll(async () => {
        coll = await common.safeCollection(db, 'articles')
        const success = await coll.create(data)
        assert.strictEqual(success, true)
    })

    afterAll(async () => {
        const success = await coll.remove()
        assert.strictEqual(success, true)
    })

    it('根据已有字段排序', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .sort({
                age: -1,
                score: -1
            })
            .project({
                _id: 0
            })
            .end()
        assert.deepStrictEqual(result.data[0], {
            author: 'justan',
            score: 95,
            age: 33
        })
        assert.deepStrictEqual(result.data[result.data.length - 1], {
            author: 'bob',
            score: 60,
            age: 18
        })
    })
})

describe('unwind', () => {
    let coll = null
    const data = [
        { product: 'tshirt', size: ['S', 'M', 'L'] },
        { product: 'pants', size: [] },
        { product: 'socks', size: null },
        { product: 'trousers', size: ['S'] },
        { product: 'sweater', size: ['M', 'L'] }
    ]

    beforeAll(async () => {
        coll = await common.safeCollection(db, 'articles')
        const success = await coll.create(data)
        assert.strictEqual(success, true)
    })

    afterAll(async () => {
        const success = await coll.remove()
        assert.strictEqual(success, true)
    })

    it('解构', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .unwind('$size')
            .project({
                _id: 0
            })
            .end()
        assert.strictEqual(result.data.length, 6)
        assert.deepStrictEqual(result.data[0], {
            product: 'tshirt',
            size: 'S'
        })
    })

    it('解构后，保留原数组索引', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .unwind({
                path: '$size',
                includeArrayIndex: 'arrayIndex'
            })
            .project({
                _id: 0
            })
            .end()
        assert.strictEqual(result.data.length, 6)
        assert.deepStrictEqual(result.data[0], {
            arrayIndex: 0,
            product: 'tshirt',
            size: 'S'
        })
    })

    it('保留空值', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .unwind({
                path: '$size',
                preserveNullAndEmptyArrays: true
            })
            .project({
                _id: 0
            })
            .end()
        assert.strictEqual(result.data.length, 8)
        assert.deepStrictEqual(result.data[0], {
            product: 'tshirt',
            size: 'S'
        })
    })
})

describe('Date', () => {
    let coll = null

    const date = new Date(1557826731686)
    const data = [{ date }]

    beforeAll(async () => {
        coll = await common.safeCollection(db, 'articles')
        const success = await coll.create(data)
        assert.strictEqual(success, true)
        const queryRes = await db
            .collection('articles')
            .where({})
            .get()
        // console.log('queryRes:', queryRes)
    })

    afterAll(async () => {
        const success = await coll.remove()
        assert.strictEqual(success, true)
    })

    it('Date类型', async () => {
        const result = await db
            .collection('articles')
            .aggregate()
            .project({
                _id: 0
            })
            .end()

        assert.deepStrictEqual(result.data[0], { date })
    })

    it('Date的各种操作符', async () => {
        const $ = db.command.aggregate
        const result = await db
            .collection('articles')
            .aggregate()
            .project({
                _id: 0,
                date: 1,
                dayOfWeek: $.dayOfWeek('$date'),
                dayOfYear: $.dayOfYear('$date'),
                dayOfMonth: $.dayOfMonth('$date'),
                year: $.year('$date'),
                month: $.month('$date'),
                hour: $.hour('$date'),
                minute: $.minute('$date'),
                second: $.second('$date'),
                millisecond: $.millisecond('$date'),
                week: $.week('$date'),
                dateFromParts: $.dateFromParts({
                    year: 2017,
                    month: 2,
                    day: 8,
                    hour: 12,
                    timezone: 'America/New_York'
                }),
                dateFromString: $.dateFromString({
                    dateString: date.toISOString()
                }),
                isoDayOfWeek: $.isoDayOfWeek('$date'),
                isoWeek: $.isoWeek('$date'),
                isoWeekYear: $.isoWeekYear('$date')
            })
            .end()
        assert.deepStrictEqual(result.data[0], {
            date,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            dayOfMonth: date.getDate(),
            hour: date.getUTCHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            millisecond: date.getMilliseconds(),
            dayOfYear: 134,
            dayOfWeek: 3,
            week: 19,
            dateFromParts: new Date('2017-02-08T17:00:00.000Z'),
            dateFromString: date,
            isoDayOfWeek: 2,
            isoWeek: 20,
            isoWeekYear: 2019
        })
    })
})

describe('lookup', () => {
    let coll1 = null
    let coll2 = null

    const data1 = [
        { name: 'stark', age: 24 },
        { name: 'justan', age: 24 },
        { name: 'jimmy', age: 24 }
    ]
    const data2 = [
        { name: 'stark', gender: 'male' },
        { name: 'justan', gender: 'male' },
        { name: 'jimmy', gender: 'male' }
    ]

    beforeAll(async () => {
        coll1 = await common.safeCollection(db, 'join1')
        coll2 = await common.safeCollection(db, 'join2')
        const success1 = await coll1.create(data1)
        const success2 = await coll2.create(data2)
        assert.strictEqual(success1, true)
        assert.strictEqual(success2, true)
    })

    afterAll(async () => {
        const success1 = await coll1.remove()
        assert.strictEqual(success1, true)
        const success2 = await coll2.remove()
        assert.strictEqual(success2, true)
    })

    it('lookup', async () => {
        const result = await db
            .collection('join1')
            .aggregate()
            .lookup({
                from: 'join2',
                localField: 'name',
                foreignField: 'name',
                as: 'join'
            })
            .end()
        assert(result.data[0].name === 'stark')
        assert(result.data[0].age === 24)
        assert(result.data[0].join[0].gender === 'male')
    })
})

describe('geoNear', () => {
    let coll1 = null
    const date = new Date()

    const data1 = [
        {
            _id: 'geoNear.0',
            city: 'Guangzhou',
            docType: 'geoNear',
            date: date,
            location: {
                type: 'Point',
                coordinates: [113.30593, 23.1361155]
            },
            name: 'Canton Tower'
        },
        {
            _id: 'geoNear.1',
            city: 'Hangzhou',
            docType: 'geoNear',
            date: new Date(date.getTime() - 1000),
            location: {
                type: 'Point',
                coordinates: [113.306789, 23.1564721]
            },
            name: 'Baiyun Mountain'
        },
        {
            _id: 'geoNear.2',
            city: 'Beijing',
            docType: 'geoNear',
            date: new Date(date.getTime() + 1000),
            location: {
                type: 'Point',
                coordinates: [116.3949659, 39.9163447]
            },
            name: 'The Palace Museum'
        },
        {
            _id: 'geoNear.3',
            city: 'Beijing',
            docType: 'geoNear',
            location: {
                type: 'Point',
                coordinates: [116.2328567, 40.242373]
            },
            name: 'Great Wall'
        }
    ]

    beforeAll(async () => {
        coll1 = await common.safeCollection(db, 'attractions')

        const success1 = await coll1.create(data1)

        assert.strictEqual(success1, true)
    })

    afterAll(async () => {
        const success1 = await coll1.remove()
        assert.strictEqual(success1, true)
    })

    it('geoNear', async () => {
        const $ = db.command.aggregate
        const _ = db.command
        const res = await db
            .collection('attractions')
            .aggregate()
            .geoNear({
                distanceField: 'distance', // 输出的每个记录中 distance 即是与给定点的距离
                spherical: true,
                near: new db.Geo.Point(113.3089506, 23.0968251),
                query: {
                    city: /zhou/,
                    date: _.lt(date)
                },
                key: 'location', // 若只有 location 一个地理位置索引的字段，则不需填
                includeLocs: 'location' // 若只有 location 一个是地理位置，则不需填
            })
            .end()
        assert.strictEqual(res.data.length === 1 && res.data[0].city === 'Hangzhou', true)
        assert.strictEqual(res.data[0].distance === 6643.521654040738, true)
    })
})

describe('mongodb raw', ()=>{
    let coll = null

    beforeAll(async () => {
        coll = await common.safeCollection(db, 'mongoraw')
        assert.strictEqual(await coll.create([
            {
                key: "a"
            }
        ]), true)
    })

    afterAll(async () => {
        assert.strictEqual(await coll.remove(), true)
    })

    it('match and count', async () => {
        const res1 = await db.collection('mongoraw')
            .options({ raw: true })
            .aggregate([{ $match: { key: "a" }}, { $count: "keyA"}])
            .end()
        assert(res1.data[0]["keyA"] === 1)

        const res2 = await db.collection('mongoraw')
            .options({ raw: true })
            .aggregate([{ $match: { key: { $eq: "a" }}}, { $count: "keyA"}])
            .end()
        assert(res1.data[0]["keyA"] === res2.data[0]["keyA"])
    })
})
