import * as core from "@actions/core";
import got, { Got } from "got";
import { CookieJar } from "tough-cookie";
import TelegramBot from "node-telegram-bot-api";
import { LoginForm, DailyReportForm, DailyReportResponse } from "./form.js";
import { sleep, randomBetween } from "./utils.js";
import {debuglog} from "util";

// const LOGIN = "https://auth.bupt.edu.cn/authserver/login";
// const GET_REPORT = "https://app.bupt.edu.cn/ncov/wap/default/index";
// const POST_REPORT = "https://app.bupt.edu.cn/ncov/wap/default/save";
const LOGIN = "https://zjuam.zju.edu.cn/cas/login";
const GET_REPORT = "https://healthreport.zju.edu.cn/ncov/wap/default/index";
const POST_REPORT = "https://healthreport.zju.edu.cn/ncov/wap/default/save";
const RETRY = 100;
const TIMEOUT = 2000;

async function login(
    loginForm: LoginForm
): Promise<Got> {
    const cookieJar = new CookieJar();
    const client = got.extend({
        cookieJar,
        headers: {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36"
        },
        retry: {
            limit: RETRY,
            methods: ["GET", "POST"],
        },
        timeout: {
            request: TIMEOUT,
        },
        throwHttpErrors: false,
    });

    // get `execution` field, will be used in post form data
    let response = await client.get(LOGIN);
    // const execution = response.body.match(/<input type="hidden" name="execution" value=.*>/);
    const execution = response.body.match(/<input type="hidden" name="execution" value=.*>/)?.[0]?.replace('<input type="hidden" name="execution" value="', '')?.replace('" />', '');
    // /input name="execution" value=.*><input name="_eventId"/)?.[0]?.replace('input name="execution" value="', '')?.replace('"/><input name="_eventId"', '');
    // throw new Error(`parse execution field failed`+execution);
    if (!execution) {
        throw new Error(`parse execution field failed`+response.body.toString());
    }else{
        console.log("execution"+execution)
    }

    // embed additional fields
    loginForm = {
        submit: "LOGIN",
        type: "username_password",
        _eventId: "submit",
        execution,
        ...loginForm,
    }

    // login now,
    // we need the cookie, and that's it! do not follow redirects
    response = await client.post(LOGIN, { form: loginForm, followRedirect: false });

    if (response.statusCode != 302) {
        throw new Error(`login ??????????????? ${response.statusCode}????????? 302`);
    }


    return client;
}

async function getDailyReportFormData(
    client: Got
): Promise<DailyReportForm> {
    const response = await client.get(GET_REPORT);
    if (response.statusCode != 200) {
        throw new Error(`getFormData ??????????????? ${response.statusCode}`);
    }
    if (response.body.indexOf("??????") != -1) {
        throw new Error("??????????????????????????????????????????????????????");
    }
    console.log(response.body.toString())
    const newForm: DailyReportForm = JSON.parse(
        /var def = (\{.+\});/.exec(response.body)?.[1] ?? ""
    );
    const oldForm: DailyReportForm = JSON.parse(
        /oldInfo: (\{.+\}),/.exec(response.body)?.[1] ?? ""
    );

    if (oldForm.geo_api_info === undefined) {
        throw new Error("????????????????????????????????????????????????????????????????????????");
    }

    const geo = JSON.parse(oldForm.geo_api_info);

    // ??????????????????
    const province = geo.addressComponent.province;
    let city = geo.addressComponent.city;
    if (geo.addressComponent.city.trim() === "" && ["?????????", "?????????", "?????????", "?????????"].indexOf(province) > -1) {
        city = geo.addressComponent.province;
    } else {
        city = geo.addressComponent.city;
    }
    const area = geo.addressComponent.province + " "
        + geo.addressComponent.city + " "
        + geo.addressComponent.district;
    const address = geo.formattedAddress;

    Object.assign(oldForm, newForm);

    // ?????????????????????
    oldForm.province = province;
    oldForm.city = city;
    oldForm.area = area;
    oldForm.address = address;

    // ????????????????????????
    // ???????????????????????????
    oldForm.ismoved = "0";
    // ????????????????????????
    oldForm.bztcyy = "";
    // ????????????????????????
    oldForm.sfsfbh = "0";


    return oldForm;
}

async function postDailyReportFormData(
    client: Got,
    formData: DailyReportForm
): Promise<DailyReportResponse> {
    const response = await client.post(POST_REPORT, { form: formData });
    if (response.statusCode != 200) {
        throw new Error(`postFormData ??????????????? ${response.statusCode}`);
    }
    return JSON.parse(response.body);
}

(async (): Promise<void> => {
    const loginForm: LoginForm = {
        username: process.env["ZJU_USERNAME"],
        password: process.env["ZJU_PASSWORD"]
    }

    if (!(!!loginForm.username && !!loginForm.password)) {
        throw new Error("??????????????????????????? Settings ??? Secrets ????????? ZJU_USERNAME ??? ZJU_PASSWORD");
    }

    console.log("???????????????");

    const client = await login(loginForm);

    await sleep(randomBetween(2000, 4000));

    console.log("??????????????????????????????????????????");

    const formData = await getDailyReportFormData(client);

    await sleep(randomBetween(2000, 4000));

    console.log("????????????????????????????????????");

    const reportReponse = await postDailyReportFormData(client, formData);

    console.log(`?????????????????????${reportReponse.m}`);

    const chatId = process.env["TG_CHAT_ID"];
    const botToken = process.env["TG_BOT_TOKEN"];

    if (!!chatId && !!botToken && reportReponse.m !== "?????????????????????") {
        const bot = new TelegramBot(botToken);
        await bot.sendMessage(
            chatId,
            `?????????????????????${reportReponse.m}`,
            { "parse_mode": "Markdown" }
        );
    }
})().catch(err => {
    const chatId = process.env["TG_CHAT_ID"];
    const botToken = process.env["TG_BOT_TOKEN"];

    if (!!chatId && !!botToken && err instanceof Error) {
        const bot = new TelegramBot(botToken);
        bot.sendMessage(
            chatId,
            `???????????????\`${err.message}\``,
            { "parse_mode": "Markdown" }
        );
        console.log(err);
    } else {
        throw err;
    }
}).catch(err => {
    if (err instanceof Error) {
        console.log(err.stack);
        core.setFailed(err.message);
    } else {
        core.setFailed(err);
    }
});
