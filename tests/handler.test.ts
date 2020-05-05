import { APIGatewayProxyEvent, Context, Callback } from 'aws-lambda';
import { getRemainingTasks, GetRemainingTasksProp } from '#/handler'

const dummyContext = {} as Context
const dummyCallback = {} as Callback
const eventBase = {} as APIGatewayProxyEvent

describe('getRemainingTasks', ():void => {
  const event:GetRemainingTasksProp = Object.assign(eventBase, {
    userId : '00295cc6-bb19-4aa1-8da3-fa54ed3c6b73'
  })
  const result = getRemainingTasks(event, dummyContext, dummyCallback)
  console.log('result')
  console.log(result)
  expect(result).toMatch('test-content')
})