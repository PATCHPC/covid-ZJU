export interface LoginForm {
    username?: string;
    password?: string;
    submit?: string;
    type?: string;
    _eventId?: string;
    execution?: string;
}

export interface DailyReportResponse {
    e: number;
    m: string;
    d: {};
}

export interface DailyReportForm {
    ismoved: string;
    jhfjrq: string;
    jhfjjtgj: string;
    jhfjhbcc: string;
    szgj: string;
    szcs: string;
    zgfxdq: string;
    mjry: string;
    csmjry: string;
    ymjzxgqk: string;
    xwxgymjzqk: string;
    tw: string;
    sfcxtz: string;
    sfjcbh: string;
    sfcxzysx: string;
    qksm: string;
    sfyyjc: string;
    jcjgqr: string;
    remark: string;
    address: string;
    geo_api_info: string;
    area: string;
    province: string;
    city: string;
    sfzx: string;
    sfjcwhry: string;
    sfjchbry: string;
    sfcyglq: string;
    gllx: string;
    glksrq: string;
    jcbhlx: string;
    jcbhrq: string;
    bztcyy: string;
    sftjhb: string;
    sftjwh: string;
    sfsfbh: string;
    xjzd: string;
    jcwhryfs: string;
    jchbryfs: string;
    szsqsfybl: string;
    sfygtjzzfj: number;
    gtjzzfjsj: string;
    sfjzxgym: string;
    sfjzdezxgym: string;
    sqhzjkkys: string;  // 杭州健康码颜色，1:绿色 2:红色 3:黄色
    sfqrxxss: string;   // 是否确认消息属实
    sfsqhzjkk: string;  // 是否申领杭州健康码
    jrdqtlqk: string[];   // 浙江返回
    jrdqjcqk: string[];   // 返回

    jcjg: string;
    created_uid: number;
    date: string;
    uid: string;
    created: number;
    id: number;
}
