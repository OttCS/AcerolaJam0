ZEPHYR.Keys.bind('KeyF', () => ZEPHYR.utils.toggleFullScreen(document.body));

ENGINE.Assets.fastCache(ENGINE.Assets.list).then(() =>
    (ENGINE.Editor && ENGINE.Editor.level) ? ENGINE.importLevel(ENGINE.Editor.level) : ENGINE.importLevel('none')
).then(() => {
    if (ENGINE.Editor) {
        ENGINE.Editor.init();
    } else {
        GAME.player = Player.new(0, 0, 1);
        SCENE.world.put(GAME.player);
        SCENE.world.target = GAME.player.sprite;

        SCENE.world.put(Environment.create(1, 0, 0, 1).render());

        SCENE.ticker.add(delta => {
            GAME.player.controller(delta);
        });
    }
});