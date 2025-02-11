// CountdownToXMAS / Christmas Countdown [BOT] :: Countdown Functions by Eartharoid
const fs = require('fs');
const log = require("leekslazylogger");
const Discord = require('discord.js');
const config = require("../config.json");
const database = require("../database.json");
const utils = require("./utils.js");



module.exports.time = () => {
    const n = new Date();
    const h = ('0' + n.getHours()).slice(-2);
    const m = ('0' + n.getMinutes()).slice(-2);
    const s = ('0' + n.getSeconds()).slice(-2);
    let time = {
        "hours": h,
        "minutes": m,
        "seconds": s,
        "timestamp": `${h}:${m}:${s}`
    };
    return time;
}


module.exports.live = () => {
    // return EXACT TIME left to Christmas
    let today = new Date();
    let xmas = new Date(today.getFullYear(), 11, 25);

    if (today.getMonth() == 11 && today.getDate() > 24) {
        xmas.setFullYear(xmas.getFullYear() + 1);
    }


    let days = Math.trunc((xmas.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let hours = Math.trunc((xmas.getTime() - today.getTime()) / (1000 * 60 * 60));
    let mins = Math.trunc((xmas.getTime() - today.getTime()) / (1000 * 60));
    let secs = Math.trunc((xmas.getTime() - today.getTime()) / (1000));

    let res = {
        "days": days,
        "hours": hours - (days * 24),
        "mins": mins - (hours * 60),
        "secs": secs - (mins * 60)
    };

    return res;
}



module.exports.weeksLeft = () => {
    // return WEEKS left to Christmas
    let today = new Date();
    let xmas = new Date(today.getFullYear(), 11, 25); // 24

    if (today.getMonth() == 11 && today.getDate() > 24) {
        xmas.setFullYear(xmas.getFullYear() + 1);
    }

    const one_week = 1000 * 60 * 60 * 24 * 7;
    let weeks = Math.trunc((xmas.getTime() - today.getTime()) / (one_week));

    return weeks;
}


module.exports.daysLeft = () => {
    // return DAYS left to Christmas
    let today = new Date();
    let xmas = new Date(today.getFullYear(), 11, 25);

    if (today.getMonth() == 11 && today.getDate() > 24) {
        xmas.setFullYear(xmas.getFullYear() + 1);
    }

    const one_day = 1000 * 60 * 60 * 24;
    let days = Math.trunc((xmas.getTime() - today.getTime()) / (one_day));

    return days;
}


module.exports.sleepsLeft = () => {
    // return SLEEPS left to Christmas
    let days = module.exports.daysLeft();
    return days + 1;
}


module.exports.message = () => {
    let x = module.exports.daysLeft();
    if (x === 365) {
        return ":snowflake: **Merry Christmas!** :snowflake:";
    } else if (x === 0) {
        return "It's Christmas Eve!";
    } else {
        return false;
    }
}



module.exports.days = () => {
    let x = module.exports.daysLeft();
    let res = {
        "text": x !== 1 ? "days" : "day",
        "verb": x !== 1 ? "are" : "is"
    };
    return res;
}


module.exports.sleeps = () => {
    let x = module.exports.sleepsLeft();
    let res = {
        "text": x !== 1 ? "sleeps" : "sleep",
        "verb": x !== 1 ? "are" : "is"
    };
    return res;
}

module.exports.text = () => {
    let x = module.exports.live();
    let res = {
        "days": x.days !== 1 ? "Days" : "Day",
        "hours": x.hours !== 1 ? "Hours" : "Hour",
        "mins": x.mins !== 1 ? "Minutes" : "Minute",
        "secs": x.secs !== 1 ? "Seconds" : "Second",
    };
    return res;
};

function disable(guild, db, client) {
    db.query(`UPDATE ${database.table} SET enabled = false WHERE guild = "${guild.id}"`, function (err, result) {
        if (err) {
            log.error(err)
        };
        if (config.debug) {
            log.debug(result)
        }
        log.console(`Automatically ${log.colour.redBright("disabled")} daily countdown for \"${guild.name}\" (missing permissions or channel)`);
        utils.affected(result.affectedRows, result.changedRows);
    });
    db.query(`UPDATE ${database.table} SET channel = null WHERE guild = "${guild.id}"`, function (err, result) {
        if (err) {
            log.error(err)
        };
        if (config.debug) {
            log.debug(result)
        }
        log.console(`Cleared countdown channel for \"${guild.name}\" (missing permissions or channel)`);
        utils.affected(result.affectedRows, result.changedRows);
    });
}
module.exports.daily = async (client, db) => {
    // DAILY COUNTDOWN
    log.info("Starting daily countdown...");
    db.query(`SELECT * FROM ${database.table} WHERE enabled = true`, function (err, result) {
        if (err) {
            log.error(err)
        };
        if (config.debug) {
            log.debug(result)
        }
        // do something with result
        if (!result) return log.warn("No database result - COULD NOT SEND DAILY COUNTDOWN!!");

        log.info(`Sending countdown to ${result.length} servers`, "magentaBright")
        for (x in result) {
            if (!typeof result[x].channel === "string") return;
            let channel = client.channels.get(result[x].channel);
            let guild = client.guilds.get(result[x].guild);

            if (!client.guilds.has(result[x].guild)) {
                return db.query(`DELETE FROM ${database.table} WHERE guild = "${result[x].guild}";`, function (err, result) {
                    if (err) {
                        log.warn("Could not delete row from database table");
                        return log.error(err);
                    };
                    log.console(`Automatically ${log.colour.redBright("removed")} a server (server doesn't exist)`);
                    utils.affected(result.affectedRows);
                    if (config.debug) {
                        log.debug(result)
                    };
                });
            }

            if (typeof guild === "undefined") {
                log.warn(`Skipping ${result[x].guild}`)
                continue;
            }

            if (!client.channels.has(result[x].channel)) {
                if (guild.owner.user.dmChannel) {
                    try {
                        guild.owner.send(`The daily countdown has been disabled for **${guild.name}** due to the set channel being missing. Use \`${config.prefix}channel\` to re-enable.`);
                    } catch {
                        log.warn("Error sending message to guild owner");
                    }
                } else {
                    log.warn("Disabled countdown for a server due to missing channel and could not alert owner");
                }

                return disable(guild, db, client);
            };

            try {
                if (!channel.permissionsFor(guild.me).has('EMBED_LINKS') || !channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
                    disable(guild, db, client)
                    if (channel.permissionsFor(channel.guild.me).has('SEND_MESSAGES')) {
                        return channel.send(`:x: The bot needs \`EMBED_LINKS\` permission to send the daily countdown.\n\nThe daily countdown for **${guild.name}** has been disabled due to missing permissions. Use \`${config.prefix}channel\` to re-enable.`)
                    } else {
                        if (guild.owner.user.dmChannel) {
                            try {
                                return channel.guild.owner.send(`The bot needs \`SEND_MESSAGES\` and \`EMBED_LINKS\` permissions to send the daily countdown.\n\nThe daily countdown has been disabled due to missing permissions. Use \`${config.prefix}channel\` to re-enable.`);
                            } catch {
                                return log.warn(`Error sending message to guild owner`);
                            }

                        } else {
                            return log.warn(`Unable to notify owner of "${channel.guild.name}" of permission error`);
                        }


                    }
                };
                // bot has permission
                if (module.exports.daysLeft() === 365) {
                    const embed = new Discord.RichEmbed()
                        .setColor(config.colour)
                        .setTitle(`It's Christmas Day! :tada:`)
                        .setTimestamp()
                        .setFooter(config.name, client.user.avatarURL);

                    if (module.exports.message()) {
                        embed.setDescription(`There ${module.exports.sleeps().verb} **${module.exports.sleepsLeft()} ${module.exports.sleeps().text}** left until Christmas!\n\n${module.exports.message()}\n\nWatch the live countdown at [${config.website}](${config.url}?utm_source=discord&utm_medium=cmd-embed&utm_campaign=sleepsleft)`)
                    } else {
                        embed.setDescription(`There ${module.exports.sleeps().verb} **${module.exports.sleepsLeft()} ${module.exports.sleeps().text}** left until Christmas!\n\nWatch the live countdown at [${config.website}](${config.url}?utm_source=discord&utm_medium=cmd-embed&utm_campaign=sleepsleft)`)
                    }
                    if (typeof result[x].role === "string" && result[x].mention === 1) {
                        channel.send(`<@&${result[x].role}>`)
                    }

                    setTimeout(() => {
                        return channel.send({
                            embed
                        });
                    }, 200);

                } else {
                    const embed = new Discord.RichEmbed()
                        .setColor(config.colour)
                        .setTitle(`${module.exports.sleepsLeft()} ${module.exports.sleeps().text} left`)
                        .setTimestamp()
                        .setFooter(config.name, client.user.avatarURL);

                    if (module.exports.message()) {
                        embed.setDescription(`There ${module.exports.sleeps().verb} **${module.exports.sleepsLeft()} ${module.exports.sleeps().text}** left until Christmas!\n\n${module.exports.message()}\n\nWatch the live countdown at [${config.website}](${config.url}?utm_source=discord&utm_medium=cmd-embed&utm_campaign=sleepsleft)`)
                    } else {
                        embed.setDescription(`There ${module.exports.sleeps().verb} **${module.exports.sleepsLeft()} ${module.exports.sleeps().text}** left until Christmas!\n\nWatch the live countdown at [${config.website}](${config.url}?utm_source=discord&utm_medium=cmd-embed&utm_campaign=sleepsleft)`)
                    }
                    if (typeof result[x].role === "string" && result[x].mention === 1) {
                        channel.send(`<@&${result[x].role}>`)
                    }
                    setTimeout(() => {
                        return channel.send({
                            embed
                        });
                    }, 200);
                };

            } catch {
                log.warn(`Error executing daily countdown for "${channel.guild.name}"`)
            }
        }

    });
};